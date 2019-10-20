""" Implements AWS API helpers. """

import boto3


class AwsAPIHelper():
    """ An API helper class (initialized once per thread) """
    
    def __init__(self):
        self._client = boto3.client('ec2')

    @property
    def client(self):
        """ Returns the AWS EC2 client. """
        return self._client

    def debug(self):
        # Retrieves all regions/endpoints that work with EC2
        response = self._client.describe_regions()
        print('Regions:', response['Regions'])

        # Retrieves availability zones only for region of the ec2 object
        response = self._client.describe_availability_zones()
        print('Availability Zones:', response['AvailabilityZones'])

        response = self._client.describe_regions(RegionNames=["eu-west-1"])
        print(response)
