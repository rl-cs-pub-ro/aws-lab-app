#!/usr/bin/env python3

from lib.config import load_config
from lib.logging import configure_logging
from lib.web import AwsWebApp
from lib.aws.worker import ThreadPool
from lib.store import ApplicationStore


if __name__ == '__main__':
    config = load_config()
    configure_logging()
    thread_pool = ThreadPool(config["server"]["workers"], config["aws"])
    store = ApplicationStore(config.get("data_store", {}), thread_pool)

    app = AwsWebApp(config=config, store=store, thread_pool=thread_pool)
    app.start()

