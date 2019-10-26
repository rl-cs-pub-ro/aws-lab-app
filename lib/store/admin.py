""" Synchronized (multithread) store for the admin tokens. """

import random
import os.path
from threading import Lock

from ._file import FileStore


class AdminAuthStore(FileStore):
    """ Persistent store for administrator authentication tokens. """

    # persist the authentication status of the admins
    AUTH_FILE = "admin_auth.yaml"

    def __init__(self, store_config):
        file_path = os.path.join(store_config["path"], self.AUTH_FILE)
        super().__init__(file_path)

        self._config = store_config
        self._lock = Lock()
        self._auth = {}
        self.reload()

    def reload(self):
        """ Reloads the file. """
        with self._lock:
            self._auth = {}
            auth_data = self._load_file()
            if auth_data:
                self._auth = auth_data.get("auth", {})

    def check_auth_token(self, auth_token):
        """ Checks the auth token of the admin. """
        with self._lock:
            return auth_token in self._auth

    def authenticate(self, user, password):
        """ Checks the username and password and authenticates the admin. """
        admin_cfg = self._config.get("admin", {})
        print("CFG", admin_cfg)
        if not admin_cfg.get("username", None) or not admin_cfg.get("password"):
            return None  # deny login if no password is set
        if admin_cfg["username"] != user or admin_cfg["password"] != password:
            return None
        with self._lock:
            new_token = hex(random.getrandbits(256))[2:]
            self._auth[new_token] = True
            # TODO: store date and cleanup old entries
            self._save()
            return new_token

    def _save(self):
        """ Saves the lab vars back to file. Note: use a lock before calling this! """
        self._save_file({
            "auth": self._auth
        })
