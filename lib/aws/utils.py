""" AWS-related utility routines. """

import json
from datetime import datetime


AWS_URL_TEMPLATE = "https://{account_id}.signin.aws.amazon.com/console?region={region}"


def get_aws_url(config):
    """ Returns the configured AWS url. """
    url = config.get("url", AWS_URL_TEMPLATE)
    return url.format(
        region=config.get("region", ""),
        account_id=config.get("account_id", "NO_ACCOUNT"))


class AwsJsonEncoder(json.JSONEncoder):
    """ Custom JSON encoder supporting datetime objects. """
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.timestamp()
        return super().default(obj)


class AWSSafeExec(object):
    """ Context manager for safely executing AWS API routines (just logs / registers the errors
        encountered). """
    def __init__(self, name, log=None):
        self.errors = []
        self.name = name
        self.log = log

    def __enter__(self):
        return self

    def __exit__(self, exc, value, traceback):
        if not exc:
            return True
        if self.log:
            self.log.warning(self.name + ": " + str(value))
        self.errors.append(value)
        return True

