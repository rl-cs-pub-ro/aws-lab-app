""" Model classes for the managed AWS resources (+ thread safe collections). """

import time
from threading import Lock
from concurrent.futures import Future

from ..aws.tasks import (
    RetrieveStudentUsers, ChangeUserPassword, RetrieveEC2Resources
)


TASK_TIMEOUT = 10  # seconds


class AWSUsersManager():
    """ Functions for managing the AWS users. """

    DEFAULT_CONFIG = {
        "pattern": "student[0-9]+",
    }

    def __init__(self, config, thread_pool):
        # config path: "aws.users"
        new_config = dict(self.DEFAULT_CONFIG)
        if config:
            new_config.update(config)

        self._config = new_config
        self._thread_pool = thread_pool

    def fetch_users(self):
        """ Fetches (refreshes, if required) and returns the users collection. """
        task = RetrieveStudentUsers(pattern=self._config["pattern"])
        task_future = self._thread_pool.queue_task(task)
        return task_future.result(timeout=TASK_TIMEOUT)

    def change_user_password(self, username, password):
        """ Changes the AWS user's password (note: non blocking). """
        # set a new password using the AWS IAM API
        task = ChangeUserPassword(
            username=username, new_password=password,
            retry=3)
        # queue a task to set the user's password, but don't wait for it
        # we need to return the token ASAP
        return self._thread_pool.queue_task(task)


class AWSResourcesManager():
    """ Manages AWS resources. """

    TYPES = ["instances", "vpc"]

    def __init__(self, config, thread_pool):
        self._config = config
        self._thread_pool = thread_pool

    def fetch_resources(self):
        task = RetrieveEC2Resources()
        task_future = self._thread_pool.queue_task(task)
        return task_future.result(timeout=TASK_TIMEOUT)


class AWSResource():
    """ Encapsulates the data of a generic AWS resource. """

    __slots__ = ("type", "id", "name", "owner")

    def __init__(self):
        pass

