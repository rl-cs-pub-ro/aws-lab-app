from threading import Thread
import queue
import logging

from .api_helper import AwsAPIHelper


QUEUE_TIMEOUT = 0.1  # seconds to sleep
NUM_THREADS = 3

logger = logging.getLogger(__name__)


class AwsWorkerThread(Thread):
    """ AWS command processing thread """
    def __init__(self, queue):
        super().__init__()
        self._queue = queue
        self._finished = False
        self._aws = AwsAPIHelper()
        self.start()

    def run(self):
        """ The thread's loop """
        while not self._finished:
            try:
                task = self._queue.get(block=True, timeout=QUEUE_TIMEOUT)
                logger.debug("Executing task: %s" % task.name)
                task.execute(self._aws)
                self._queue.task_done()
            except queue.Empty:
                continue
            except Exception as exc:
                logger.error(exc)
                self._queue.task_done()

    def shutdown(self):
        """ Signals the shutdown signal to the thread """
        self._finished = True


class ThreadPool:
    """ Pool of threads consuming tasks from a queue """

    def __init__(self, num_threads):
        self._queue = queue.Queue()
        self._threads = []
        for _ in range(num_threads):
            self._threads.append(AwsWorkerThread(self._queue))

    def add_task(self, task):
        """ Add a task to the queue """
        logger.debug("New task: %s" % task.name)
        self._queue.put(task)

    def wait_completion(self):
        """ Wait for completion of all the tasks in the queue """
        self._queue.join()

    def join(self):
        """ Shuts down all threads """
        logger.info("Shutting down the thread pool...")
        for thread in self._threads:
            thread.shutdown()
        for thread in self._threads:
            thread.join()
        logger.info("Thread pool stopped!")

