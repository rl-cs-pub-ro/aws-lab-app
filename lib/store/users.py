""" Synchronized (multithread) store for the student accounts. """

import time
import os.path
import logging
from threading import Lock

from lib.model.aws import AWSUsersManager
from lib.model.student_users import StudentAccountCollection
from ._file import FileStore

log = logging.getLogger(__name__)


class StudentAccountsStore(FileStore):
    """ Persistent store for the student users. """

    DEFAULT_CONFIG = {
        "refresh": 10,  # seconds
        "users": {},
    }

    USERS_FILE = "student_users.yaml"

    def __init__(self, store_config, thread_pool):
        file_path = os.path.join(store_config["path"], self.USERS_FILE)
        super().__init__(file_path)

        self._config = dict(self.DEFAULT_CONFIG)
        self._config.update(store_config)
        self._aws_mgr = AWSUsersManager(self._config.get("users"), thread_pool)
        self._collection = StudentAccountCollection([])
        self._lock = Lock()
        self._last_fetch = None

        # load the store from file
        users = self._load_file()
        if users:
            users = users.get("users", None)
        self._collection.load_persisted(users)

    def refresh_users(self, force=False):
        """ Loads / updates the existing AWS users and returns the updated collection. """
        need_refresh = False
        with self._lock:
            refresh_time = time.time() - self._config["refresh"]
            if force or not self._last_fetch or self._last_fetch < refresh_time:
                self._last_fetch = time.time()
                need_refresh = True
        # execute the task outside the lock
        if need_refresh:
            aws_users = self._aws_mgr.fetch_users()
            log.info("Refreshed AWS users (%s)", len(aws_users))
            with self._lock:
                self._collection.load_aws(aws_users)
                self._save()

        return self.export()

    def export(self):
        """ Returns the student users as standard object. """
        with self._lock:
            return self._collection.export(persistent=False)

    def get_user(self, username):
        """ Returns a specific user's object. """
        with self._lock:
            return self._collection.get_user(username)

    def allocate_user(self):
        """ Tries to allocate an unused user account. """
        user_obj = None
        with self._lock:
            user_obj = self._collection.allocate_user()
            self._save()
        self._aws_mgr.change_user_password(
            user_obj.username, user_obj.password)
        return user_obj

    def allocate_custom_users(self, users):
        """ Forcefully allocates the specified users. """
        with self._lock:
            for username in users:
                user_obj = self._collection.allocate_custom(username)
                self._aws_mgr.change_user_password(
                    user_obj.username, user_obj.password)
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
            "users": self._collection.export(persistent=True)
        })
