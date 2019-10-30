""" Persistent data stores. """

import os.path

from ._file import FileStore
from .users import StudentAccountsStore
from .lab import LabVarsStore
from .admin import AdminAuthStore
from .aws_resources import AwsResourcesStore


class ApplicationStore():
    """ Manages the application's stores. """

    DEFAULT_CONFIG = {
        "path": "./data",
        "users": {},
        "resources": {},
        "lab": {},
        "admin": {},
    }

    def __init__(self, config, thread_pool):
        self._config = dict(self.DEFAULT_CONFIG)
        if config:
            self._config.update(config)
        for key in ["users", "lab", "admin"]:
            if "path" not in self._config[key]:
                self._config[key]["path"] = self._config["path"]

        self._users = StudentAccountsStore(self._config["users"], thread_pool)
        self._resources = AwsResourcesStore(self._config["resources"], thread_pool)
        self._lab = LabVarsStore(self._config["lab"])
        self._admin = AdminAuthStore(self._config["admin"])

    @property
    def users(self):
        """ Returns the student users store. """
        return self._users

    @property
    def lab(self):
        """ Returns the lab vars store. """
        return self._lab

    @property
    def admin(self):
        """ Returns the admin store. """
        return self._admin

    @property
    def resources(self):
        """ Returns the admin store. """
        return self._admin

