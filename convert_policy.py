#!/usr/bin/env python3
# converts a policy file fron YAML to JSON

import sys
import os.path
import yaml
import json


if __name__ == '__main__':
    filename = sys.argv[1]
    destination = os.path.splitext(filename)[0] + ".json"

    with open(filename, 'r') as yaml_in, open(destination, "w") as json_out:
        yaml_object = yaml.safe_load(yaml_in)
        json.dump(yaml_object, json_out, indent=2, sort_keys=True)

