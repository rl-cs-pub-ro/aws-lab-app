""" Implements the AWS processing task classes. """


class AwsTask():
    """ Base class for AWS tasks """
    def __init__(self, **kwargs):
        self.name = kwargs.get("name")

    def execute(self, aws):
        raise NotImplementedError()


class DeleteEC2Instances(AwsTask):
    """ Stops & deletes EC2 instances """
    def execute(self, aws):
        # stop-instance, apoi terminate, apoi terminated -> it's done
        pass


class DeleteVPCTask(AwsTask):
    """ Deletes a VPC and all associated resources """
    def execute(self, aws):
        # ec2: delete-vpc, delete-internet-gateway, delete-subnet, delete-network-interface
        # subnets <- network interfaces
        # delete VPC șterge tot ;) 
        pass


class CleanUpAWSKeys(AwsTask):
    """ Cleans up AWS key pairs """
    def execute(self):
        pass

