""" Local yaml file-backed store. """

import logging
import yaml
from collections import OrderedDict
from collections.abc import Mapping

log = logging.Logger("lib.store.FileStore")


class FileStore():

    def __init__(self, file):
        self._file = file

    def _load_file(self):
        try:
            with open(self._file, 'r') as stream:
                return yaml.safe_load(stream)
        except FileNotFoundError:
            log.warning("Data file '%s' not found", str(self._file))
            return None
        except:
            log.exception("Error while reading '%s'")
            return None

    def _save_file(self, data):
        try:
            with open(self._file, "w") as stream:
                yaml.dump(data, stream, Dumper=yaml.Dumper)
        except:
            log.exception("Error while writing '%s'")


def represent_ordereddict(dumper, data):
    value = []

    for item_key, item_value in data.items():
        node_key = dumper.represent_data(item_key)
        node_value = dumper.represent_data(item_value)

        value.append((node_key, node_value))

    return yaml.nodes.MappingNode(u'tag:yaml.org,2002:map', value)


yaml.add_representer(OrderedDict, represent_ordereddict)

