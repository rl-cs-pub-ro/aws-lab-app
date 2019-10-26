""" Configuration loader. """

from collections.abc import Mapping
import yaml


DEFAULT_FILE = "config.yaml"
DEFAULT_SECRETS_FILE = "secrets.yaml"


def load_config(config_file=None, secrets_file=None):
    """ Loads the config file. """
    if not config_file:
        config_file = DEFAULT_FILE
    with open(config_file, 'r') as stream:
        config = yaml.safe_load(stream)

    if not secrets_file:
        secrets_file = config.get("secrets_file", None)
    if not secrets_file:
        secrets_file = DEFAULT_SECRETS_FILE
    with open(secrets_file, 'r') as stream:
        secrets = yaml.safe_load(stream)
        merge_secrets(config, secrets)

    return config


def merge_secrets(config, secrets):
    """ Merges the secrets into the main config structure. """
    for k in secrets.keys():
        if (k in config and isinstance(config[k], dict)
                and isinstance(secrets[k], Mapping)):
            merge_secrets(config[k], secrets[k])
        else:
            config[k] = secrets[k]

