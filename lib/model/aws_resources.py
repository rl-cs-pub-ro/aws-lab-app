""" Model classes for the managed AWS resources. """


class AWSResourceCollection():
    """ Models all managed AWS resources, grouped by type and searchable by
    owning users. """

    TYPES = ["users", "instances", "vpc"]

    def __init__(self):
        self._resources = {}


class AWSResource():
    """ Encapsulates the data of a generic AWS resource. """

    __slots__ = ("type", "id", "name", "owner")

    def __init__(self):
        pass

