from threading import Thread
import queue
import logging

from .api_helper import AwsAPIHelper


QUEUE_TIMEOUT = 0.1  # seconds to sleep
NUM_THREADS = 3

log = logging.getLogger(__name__)


class AwsWorkerThread(Thread):
    """ AWS command processing thread """
    def __init__(self, queue, aws_config):
        super().__init__()
        self._queue = queue
        self._finished = False
        self._aws = AwsAPIHelper(aws_config)
        self.start()

    def run(self):
        """ The thread's loop """
        cur_task = None
        cur_try = 1
        while not self._finished:
            try:
                if not cur_task:
                    cur_task = self._queue.get(block=True, timeout=QUEUE_TIMEOUT)
                    log.debug("Executing task: %s" % cur_task.__class__.__name__)
                else:
                    log.debug("Retrying task: %s [%i]", cur_task.__class__.__name__, cur_try)

                result = cur_task.execute(self._aws)
                if cur_task.future.set_running_or_notify_cancel():
                    cur_task.future.set_result(result)
                cur_task = None
                cur_try = 1
                self._queue.task_done()

            except queue.Empty:
                continue
            except Exception as exc:
                log.error(exc)
                if cur_task and cur_task.retry and cur_task.retry < cur_task.retry:
                    # retry task
                    cur_try += 1
                else:
                    cur_task.future.set_exception(exc)
                    cur_task = None
                    self._queue.task_done()

    def shutdown(self):
        """ Signals the shutdown signal to the thread """
        self._finished = True


class ThreadPool:
    """ Pool of threads consuming tasks from a queue """

    def __init__(self, num_threads, aws_config):
        self._queue = queue.Queue()
        self._threads = []
        for _ in range(num_threads):
            self._threads.append(AwsWorkerThread(self._queue, aws_config))

    def queue_task(self, task):
        """ Add a task to the queue """
        log.debug("New task: %s", task.__class__.__name__)
        self._queue.put(task)
        return task.future

    def wait_completion(self):
        """ Wait for completion of all the tasks in the queue """
        self._queue.join()

    def join(self):
        """ Shuts down all threads """
        log.info("Shutting down the thread pool...")
        for thread in self._threads:
            thread.shutdown()
        for thread in self._threads:
            thread.join()
        log.info("Thread pool stopped!")

