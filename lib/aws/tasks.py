""" Implements the AWS processing task classes. """

import logging
import string
import random
import time
import re
from concurrent.futures import Future

from botocore.exceptions import ClientError
from ..model.aws import normalize_resources
from .utils import AWSSafeExec

log = logging.getLogger(__name__)


class AwsTask():
    """ Base class for AWS tasks """
    def __init__(self, **kwargs):
        self.retry = kwargs.pop("retry", None)
        self.future = Future()

    def execute(self, aws):
        raise NotImplementedError()


class RetrieveStudentUsers(AwsTask):
    """ Retrieves all student users from AWS IAM. """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.pattern = kwargs.pop("pattern")

    def execute(self, aws):
        iam = aws.client("iam")
        users = iam.list_users()["Users"]
        filtered_users = []
        for user in users:
            username = user["UserName"]
            if not re.match(self.pattern, username):
                continue
            last_used = user.get("PasswordLastUsed", None)
            filtered_users.append({
                "username": username,
                "last_used": last_used.timestamp() if last_used else None
            })
        return filtered_users


class ChangeUserPassword(AwsTask):
    """ Changes an user's password """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.username = kwargs.pop("username")
        self.new_password = kwargs.pop("new_password")

    def execute(self, aws):
        iam = aws.client("iam")
        profile = None
        try:
            profile = iam.get_login_profile(UserName=self.username)
        except ClientError as ex:
            if ex.response['Error']['Code'] == 'NoSuchEntity':
                pass  # it's okay, password needs to be created
            else:
                raise ex
        if profile:
            # need to change the password
            iam.update_login_profile(UserName=self.username, Password=self.new_password,
                                     PasswordResetRequired=False)
        else:
            # need to create a login profile with the password
            iam.create_login_profile(UserName=self.username, Password=self.new_password,
                                     PasswordResetRequired=False)
        return True


class RemoveUserProfile(AwsTask):
    """ Removes an user's login profile, preventing further authentication """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.username = kwargs.pop("username")

    def execute(self, aws):
        iam = aws.client("iam")
        try:
            iam.delete_login_profile(UserName=self.username)
        except ClientError as ex:
            if ex.response['Error']['Code'] == 'NoSuchEntity':
                pass  # it's okay, profile doesn't exist
            else:
                raise ex
        return True


class RetrieveEC2Resources(AwsTask):
    """ Retrieves the collection of all relevant resources. """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def execute(self, aws):
        ec2 = aws.client("ec2")
        FETCH_TYPES = {
            "Instances": ec2.describe_instances,
            "KeyPairs": ec2.describe_key_pairs,
            "Vpcs": ec2.describe_vpcs,
            "Addresses": ec2.describe_addresses,
            "InternetGateways": ec2.describe_internet_gateways,
            "NatGateways": ec2.describe_nat_gateways,
            "Subnets": ec2.describe_subnets,
            "RouteTables": ec2.describe_route_tables,
            "SecurityGroups": ec2.describe_security_groups,
        }
        resources = {}
        for res_type, func in FETCH_TYPES.items():
            resources[res_type] = func()
        return resources


class CleanupUserResourcesTask(AwsTask):
    """ Deletes AWS user resources. """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.resource_map = kwargs.pop("resource_map")
        self.dryrun = kwargs.pop("dryrun", False)

    def execute(self, aws):
        ec2 = aws.client("ec2")

        def delete_instances(resources):
            ids = [resource.id for resource in resources]
            safexc = AWSSafeExec("delete_instances", log=log)
            for inst_id in ids:
                with safexc:
                    ec2.terminate_instances(InstanceIds=[inst_id], DryRun=self.dryrun)
            return safexc

        def delete_key_pairs(resources):
            safexc = AWSSafeExec("delete_key_pairs", log=log)
            for resource in resources:
                with safexc:
                    ec2.delete_key_pair(KeyName=resource.id, DryRun=self.dryrun)
            return safexc

        def delete_vpcs(resources):
            safexc = AWSSafeExec("delete_vpcs", log=log)
            for resource in resources:
                with safexc:
                    ec2.delete_vpc(VpcId=resource.id, DryRun=self.dryrun)
            return safexc

        def delete_addresses(resources):
            safexc = AWSSafeExec("delete_addresses", log=log)
            for resource in resources:
                with safexc:
                    ec2.release_address(AllocationId=resource.id, DryRun=self.dryrun)
            return safexc

        def delete_inet_gateways(resources):
            safexc = AWSSafeExec("delete_inet_gateways", log=log)
            for resource in resources:
                for attach in resource.raw.get("Attachments", []):
                    with safexc:
                        ec2.detach_internet_gateway(
                            InternetGatewayId=resource.id, VpcId=attach["VpcId"],
                            DryRun=self.dryrun)
                with safexc:
                    ec2.delete_internet_gateway(InternetGatewayId=resource.id, DryRun=self.dryrun)
            return safexc

        def delete_nat_gateways(resources):
            safexc = AWSSafeExec("delete_nat_gateways", log=log)
            for resource in resources:
                with safexc:
                    if not self.dryrun:
                        ec2.delete_nat_gateway(NatGatewayId=resource.id)
            return safexc

        def delete_subnets(resources):
            safexc = AWSSafeExec("delete_subnets", log=log)
            for resource in resources:
                with safexc:
                    ec2.delete_subnet(SubnetId=resource.id, DryRun=self.dryrun)
            return safexc

        def delete_route_tables(resources):
            safexc = AWSSafeExec("delete_route_tables", log=log)
            for resource in resources:
                with safexc:
                    ec2.delete_route_table(RouteTableId=resource.id, DryRun=self.dryrun)
            return safexc

        def delete_security_groups(resources):
            safexc = AWSSafeExec("delete_security_groups", log=log)
            for resource in resources:
                with safexc:
                    ec2.delete_security_group(GroupId=resource.id, DryRun=self.dryrun)
            return safexc

        ORDER = ["Instances", "KeyPairs", "RouteTables", "SecurityGroups", "Subnets", "Addresses",
                 "InternetGateways", "NatGateways", "Vpcs", ]
        DELETE_FUNCS = {
            "Instances": delete_instances,
            "KeyPairs": delete_key_pairs,
            "Vpcs": delete_vpcs,
            "Addresses": delete_addresses,
            "InternetGateways": delete_inet_gateways,
            "NatGateways": delete_nat_gateways,
            "Subnets": delete_subnets,
            "RouteTables": delete_route_tables,
            "SecurityGroups": delete_security_groups,
        }
        all_errors = []
        for res_type in ORDER:
            FUNC = DELETE_FUNCS[res_type]
            resources = self.resource_map.get(res_type, None)
            if resources:
                log.info("Deleting %s: %s", res_type, str(resources))
                safexc = FUNC(resources)
                if safexc.errors:
                    all_errors.extend(safexc.errors)
        return all_errors


