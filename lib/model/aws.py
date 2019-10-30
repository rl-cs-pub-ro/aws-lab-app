""" Model classes for the managed AWS resources (+ thread safe collections). """



class AWSResourceCollection():
    """ Encapsulates multiple AWS resources. """

    def __init__(self, data=None):
        self._data = data


class AWSResource():
    """ Encapsulates the data for a generic AWS resource. """

    __slots__ = ("type", "id", "name", "owner")

    def __init__(self):
        pass


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

