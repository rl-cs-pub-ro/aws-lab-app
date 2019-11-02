""" Model classes for the managed AWS resources (+ thread safe collections). """

import pprint
import re


RESOURCE_TYPES = {
    # {"ResourceType": (IdKey,) }
    "Instances": ("InstanceId",),
    "KeyPairs": ("KeyName",),
    "NetworkInterfaces": ("NetworkInterfaceId",),
    "Vpcs": ("VpcId",),
    "Addresses": ("AllocationId",),
    "InternetGateways": ("InternetGatewayId",),
    "NatGateways": ("NatGatewayId",),
    "Subnets": ("SubnetId",),
    "RouteTables": ("RouteTableId",),
    "SecurityGroups": ("GroupId",),
}


class AWSResourceCollection():
    """ Encapsulates multiple AWS resources. """

    def __init__(self, raw_resources=None):
        self._collection = {}
        if not raw_resources:
            raw_resources = {}
        for res_type in RESOURCE_TYPES:
            res = raw_resources.get(res_type, [])
            if res:
                self._collection[res_type] = normalize_resources(res_type, res)
            else:
                self._collection[res_type] = []

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
        for res_type in RESOURCE_TYPES:
            stats["totals"][res_type] = len(self._collection[res_type])
            for user in users:
                stats["users"].setdefault(user, {})
                stats["users"][user][res_type] = sum(
                    res.owner == user for res in self._collection[res_type])
            stats["unassigned"][res_type] = sum(
                not res.owner for res in self._collection[res_type])
        return stats

    def get_filtered(self, filter_student=None):
        """ Returns filtered resource objects and / or IDs. """
        filtered_resources = {}
        for res_type in RESOURCE_TYPES:
            resources = []
            for resource in self._collection.get(res_type, []):
                if filter_student and not resource.owner == filter_student:
                    continue
                resources.append(resource)
            filtered_resources[res_type] = resources
        return filtered_resources

    def export(self):
        """ Exports the collection as standard object, """
        return self._collection


class AWSResource():
    """ Encapsulates the data for a generic AWS resource. """

    STUDENT_PATTERN = r'^(student[0-9]+)_.+'
    RESERVED_PREFIX = "admin_"

    __slots__ = ("res_type", "id", "name", "owner", "reserved", "raw")

    def __init__(self, res_type, raw_data):
        self.res_type = res_type
        self.raw = raw_data
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
                "owner": self.owner, "reserved": self.reserved, "raw": self.raw}

    def __repr__(self):
        return "AWSResource" + str(self.export())


def normalize_resources(resource_type, raw_resources):
    """ Normalizes raw resource objects into a list of AWSResource objects. """
    ret_resources = []
    for resource in raw_resources:
        res_obj = AWSResource(res_type=resource_type, raw_data=resource)
        if res_obj.reserved:
            continue  # skip reserved resources
        ret_resources.append(res_obj)
    return ret_resources


