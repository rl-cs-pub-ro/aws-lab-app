""" Persistent data stores. """

import os.path

from ._file import FileStore
from .users import StudentAccountsStore
from .lab import LabVarsStore


class ApplicationStore():
    """ Manages the application's stores. """

    DEFAULT_CONFIG = {
        "path": "./data",
    }

    def __init__(self, config):
        self._config = dict(self.DEFAULT_CONFIG)
        if config:
            self._config.update(config)
        self._users = StudentAccountsStore(self._config)
        self._lab = LabVarsStore(self._config)

    @property
    def users(self):
        """ Returns the student users store. """
        return self._users

    @property
    def lab(self):
        """ Returns the lab vars store. """
        return self._lab

