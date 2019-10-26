""" Implements AWS API helpers. """

import boto3


class AwsAPIHelper():
    """ An API helper class (initialized once per thread) """
    
    def __init__(self, aws_config):
        self._config = aws_config
        self._session = self._new_session()

    @property
    def session(self):
        return self._session

    def client(self, name, **kwargs):
        """ Returns a specific AWS low level client. """
        return self._session.client(name, **kwargs)

    def resource(self, name, **kwargs):
        """ Returns a specific AWS resource. """
        return self._session.resource(name, **kwargs)

    def _new_session(self, **extra_options):
        options = {
            "region_name": self._config["region"],
            "aws_access_key_id": self._config["key"],
            "aws_secret_access_key": self._config["key_secret"]
        }
        options.update(extra_options)
        return boto3.session.Session(**options)

