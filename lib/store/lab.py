""" Synchronized (multithread) store for the lab vars. """

import os.path
from threading import Lock

from ._file import FileStore


class LabVarsStore(FileStore):
    """ Persistent store for lab variables. """

    LAB_FILE = "lab.yaml"
    LAB_DEFAULTS = {"password": None}

    def __init__(self, store_config):
        file_path = os.path.join(store_config["path"], self.LAB_FILE)
        super().__init__(file_path)

        self._config = store_config
        self._lock = Lock()
        self.reload()

    def reload(self):
        """ Reloads the lab config from file. """
        with self._lock:
            self._lab = dict(self.LAB_DEFAULTS)
            lab = self._load_file()
            if lab:
                lab = lab.get("lab", {})
                self._lab.update(lab)

    def check_password(self, lab_password):
        """ Checks the lab's password. """
        with self._lock:
            return self._lab.get("password", None) and lab_password and \
                lab_password == self._lab["password"]

    def get_all_vars(self):
        """ Returns the lab config (use for admins only!). """
        with self._lock:
            return dict(self._lab)

    def set_password(self, new_password):
        """ Changes the lab password """
        with self._lock:
            self._lab["password"] = new_password
            self._save()

    def _save(self):
        """ Saves the lab vars back to file. Note: use a lock before calling this! """
        self._save_file({
            "lab": self._lab
        })
