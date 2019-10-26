#!/usr/bin/env python3

from lib.config import load_config
from lib.logging import configure_logging
from lib.web import webapp_start
from lib.aws.worker import ThreadPool


NUM_THREADS = 3


if __name__ == '__main__':
    config = load_config()
    configure_logging()
    thread_pool = ThreadPool(config["server"]["workers"], config["aws"])
    webapp_start(thread_pool=thread_pool)

