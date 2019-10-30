""" Implements the AWS processing task classes. """

import string
import random
import time
import re
from concurrent.futures import Future

from botocore.exceptions import ClientError
from ..model.aws import normalize_resources


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
        self.resource_map = kwargs.pop("resourceMap")

    def execute(self, aws):
        ec2 = aws.client("ec2")
        DELETE_FUNCS = {
            "Instances": ec2.terminate_instance,
            "KeyPairs": ec2.delete_key_pair,
            "Vpcs": ec2.delete_vpc,
            "Addresses": ec2.release_address,
            "InternetGateways": ec2.delete_internet_gateway,
            "Subnets": ec2.delete_subnet,
            "RouteTables": ec2.delete_route_table,
            "SecurityGroups": ec2.delete_security_group,
        }
        for res_type, resource_ids in self.resource_map:
            FUNC = DELETE_FUNCS.get(res_type)
            FUNC(resource_ids)
        
        # instances = filter_resources(normalize_resources(
        #    "Reservations", ec2.describe_instances()))
        # for instance in instances["Instances"]:


