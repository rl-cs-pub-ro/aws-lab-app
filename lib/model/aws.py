""" Model classes for the managed AWS resources (+ thread safe collections). """

import pprint
import re


RESOURCE_TYPES = {
    # {"ResourceType": (IdKey,) }
    "Instances": ("InstanceId",),
    "KeyPairs": ("KeyName",),
    "Vpcs": ("VpcId",),
    "Addresses": ("AllocationId",),
    "InternetGateways": ("InternetGatewayId",),
    "Subnets": ("SubnetId",),
    "RouteTables": ("RouteTableId",),
    "SecurityGroups": ("GroupId",),
}


class AWSResourceCollection():
    """ Encapsulates multiple AWS resources. """

    def __init__(self, raw_resources=None):
        self._collection = {}
        if not raw_resources:
            return
        for res_type in RESOURCE_TYPES.keys():
            self._collection[res_type] = normalize_resources(
                res_type, raw_resources.get(res_type, []))

    def get_size(self):
        """ Computes the size of the collection. """
        sum = 0
        for res_type in self._collection:
            sum += len(self._collection[res_type])
        return sum

    def get_stats(self, users):
        """ Returns the usage stats for each resource type. """
        stats = {
            "totals": {},
            "users": {},
            "unassigned": {},
        }
        # pprint.pprint(self._collection)
        for res_type in RESOURCE_TYPES.keys():
            stats["totals"][res_type] = len(self._collection[res_type])
            for user in users:
                stats["users"].setdefault(user, {})
                stats["users"][user][res_type] = sum(
                    res.owner == user for res in self._collection[res_type])
            stats["unassigned"][res_type] = sum(
                not res.owner for res in self._collection[res_type])
        return stats

    def get_filtered(self, filter_student=None, return_ids=False):
        """ Returns filtered resource objects and / or IDs. """
        filtered_resources = []
        for res_type in RESOURCE_TYPES.keys():
            for resource in self._collection[res_type]:
                if filter_student and not resource.owner == student:
                    continue
                filtered_resources.append(resource)
        if return_ids:
            return [res.id for res in filtered_resources]
        return filtered_resources

    def export(self):
        """ Exports the collection as standard object, """
        return self._collection


class AWSResource():
    """ Encapsulates the data for a generic AWS resource. """

    STUDENT_PATTERN = r'^(student[0-9]+)_.+'
    RESERVED_PREFIX = "admin_"

    __slots__ = ("res_type", "id", "name", "owner", "reserved")

    def __init__(self, res_type, raw_data):
        self.res_type = res_type
        res_desc = RESOURCE_TYPES[res_type]
        self.id = raw_data.get(res_desc[0], "")
        self.name = self._extract_tag(raw_data, "Name")
        self.owner = None
        self.reserved = self.name.startswith(self.RESERVED_PREFIX)
        ownrm = re.match(self.STUDENT_PATTERN, self.name)
        if ownrm:
            self.owner = ownrm.group(1)

    @staticmethod
    def _extract_tag(raw_resource, name):
        for tag in raw_resource.get("Tags", []):
            if tag["Key"] == name:
                return tag["Value"].lower()
        return ""

    def export(self):
        return {"res_type": self.res_type, "id": self.id, "name": self.name,
                "owner": self.owner, "reserved": self.reserved}

    def __repr__(self):
        return "AWSResource" + str(self.export())


def normalize_resources(resource_type, raw_resources):
    """ Normalizes raw resource objects into a list of AWSResource objects. """
    if resource_type == "Instances":
        # special case: a reservation may contain multiple instances
        raw_resources2 = []
        for reservation in raw_resources["Reservations"]:
            raw_resources2.extend(reservation.get("Instances", []))
        raw_resources = raw_resources2
    else:
        raw_resources = raw_resources[resource_type]

    ret_resources = []
    for resource in raw_resources:
        res_obj = AWSResource(res_type=resource_type, raw_data=resource)
        if res_obj.reserved:
            continue  # skip reserved resources
        ret_resources.append(res_obj)
    return ret_resources


