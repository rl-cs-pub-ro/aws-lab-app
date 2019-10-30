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


RESOURCE_TYPES = {
    # tuple: (IdKey,)
    "Instances": ("InstanceId",)
}
STUDENT_PREFIX = "student"
RESERVED_PREFIX = "admin_"


def normalize_resources(key, resources):
    """ Normalizes the resource objects. """
    # special case: a reservation may contain multiple instances
    resources = []
    if key == "Reservations":
        instances = []
        for reservation in resources[key]:
            instances.extend(reservation.get("Instances", []))
        return {"Instances": instances}
    return {key: resources[key]}


def filter_resources(res_type, resources, prefix=None):
    """
    Filters the resources by name tag (user ownership).
    Automatically ignores 'admin_' (reserved) resources.
    """
    filtered_resources = []
    # res_desc = RESOURCE_TYPES[res_type]
    # id_key = res_desc[0]
    for resource in resources:
        name = None
        for tag in resource["Tags"]:
            if tag["Key"] == 'Name':
                name = tag["Value"].lower()
                break
        if not name:  # untagged / orphan resource
            # if prefix was given, ignore them for now
            if prefix:
                continue
        elif name.startswith(RESERVED_PREFIX) or (not name.startswith(prefix)):
            continue  # reserved prefix
        filtered_resources.append(resource)
    return filtered_resources

