""" Synchronized (multithread) store for the AWS resources collection. """

import time
import os.path
import logging
from threading import Lock

from ..aws.tasks import (
    RetrieveStudentUsers, ChangeUserPassword, RetrieveEC2Resources
)
from lib.model.aws import AWSResource, AWSResourceCollection


log = logging.getLogger(__name__)


class AwsResourcesStore():
    """ Ephermeral store for the AWS resources. """

    DEFAULT_CONFIG = {
        "refresh": 20,  # seconds
        "timeout": 20,  # seconds
        "users": {},
    }

    def __init__(self, store_config, thread_pool):
        self._config = dict(self.DEFAULT_CONFIG)
        self._config.update(store_config)
        self._thread_pool = thread_pool

        self._collection = AWSResourceCollection()
        self._lock = Lock()
        self._last_fetch = None

    def refresh_resources(self, force=False):
        """ Loads / updates the existing AWS resources. """
        need_refresh = False
        with self._lock:
            refresh_time = time.time() - self._config["refresh"]
            if force or not self._last_fetch or self._last_fetch < refresh_time:
                self._last_fetch = time.time()
                need_refresh = True
        # execute the task outside the lock
        if need_refresh:
            aws_res = self._fetch_resources()
            log.info("Refreshed AWS resources (%s)", len(aws_res))
            with self._lock:
                self._collection = aws_res

        return self.export()

    def _fetch_resources(self):
        """ Executes the resources polling task and returns the newly discovered resources. """
        task = RetrieveEC2Resources()
        task_future = self._thread_pool.queue_task(task)
        return task_future.result(timeout=self._config["timeout"])

    def export(self):
        """ Returns the student users as standard object. """
        with self._lock:
            return self._collection
