""" Synchronized (multithread) store for the student accounts. """

import os.path
import logging
from threading import Lock

from lib.model.student_users import StudentAccountCollection
from ._file import FileStore

log = logging.getLogger(__name__)


class StudentAccountsStore(FileStore):
    """ Persistent store for managing student users. """

    USERS_FILE = "student_users.yaml"

    def __init__(self, store_config):
        file_path = os.path.join(store_config["path"], self.USERS_FILE)
        super().__init__(file_path)

        self._config = store_config
        self._collection = StudentAccountCollection([])
        self._lock = Lock()

        # load the store from file
        users = self._load_file()
        if users:
            users = users.get("users", None)
        self._collection.load(users)

    def load_existing_users(self, users):
        """ Loads / updates the existing AWS users into the managed collection. """
        with self._lock:
            self._collection.load(users, no_replace=True)
            log.info("Loaded users: %s", str(users))
            self._save()

    def export(self):
        """ Returns the student users as standard object. """
        with self._lock:
            return self._collection.export()

    def get_user(self, username):
        """ Returns a specific user's object. """
        with self._lock:
            return self._collection.get_user(username)

    def allocate_user(self):
        """ Tries to allocate an unused user account. """
        with self._lock:
            user_obj = self._collection.allocate_user()
            self._save()
            return user_obj

    def reset_user(self, username):
        """ Resets an user account. """
        with self._lock:
            self._collection.reset_user(username)
            self._save()

    def _save(self):
        """ Saves the users list to file. Note: use a lock before calling this! """
        self._save_file({
            "users": self._collection.export()
        })
