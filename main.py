#!/usr/bin/env python3

from lib.web import webapp_start
from lib.aws.worker import ThreadPool


NUM_THREADS = 3


if __name__ == '__main__':
    thread_pool = ThreadPool(NUM_THREADS)
    webapp_start(thread_pool=thread_pool)

