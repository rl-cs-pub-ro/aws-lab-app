""" Implements the AWS processing task classes. """

import string
import random
import time
import re
from concurrent.futures import Future

from botocore.exceptions import ClientError


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
                "last_used": time.mktime(last_used.timetuple()) if last_used else None
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


class DeleteEC2Instances(AwsTask):
    """ Stops & deletes EC2 instances """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.username = kwargs.pop("username")

    def execute(self, aws):
        # stop-instance, apoi terminate, apoi terminated -> it's done
        pass


class DeleteVPCTask(AwsTask):
    """ Deletes a VPC and all associated resources """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.username = kwargs.pop("username")

    def execute(self, aws):
        # ec2: delete-vpc, delete-internet-gateway, delete-subnet, delete-network-interface
        # subnets <- network interfaces
        # delete VPC șterge tot ;) 
        pass


class CleanUpAWSKeys(AwsTask):
    """ Cleans up AWS key pairs """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.username = kwargs.pop("username")

    def execute(self):
        pass

