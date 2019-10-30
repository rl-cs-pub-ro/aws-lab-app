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


