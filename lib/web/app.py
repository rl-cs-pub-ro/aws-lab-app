""" Implements the main CherryPy web application class.  """

import os
import cherrypy
import cherrypy_cors

from ._utils import send_json_error
from .student import StudentController
from .admin import AdminController
from ..model.aws import AWSUsersManager


class AwsWebApp():
    """ Implements the web endpoint """

    def __init__(self, config, store, thread_pool):
        self._config = config
        self._pool = thread_pool
        self._store = store

        cherrypy_cors.install()
        cherrypy.tree.mount(self, "/", self._cherry_config())
        self._student = StudentController(app=self)
        self._admin = AdminController(app=self)
        self._static_root = os.path.join(
            os.path.abspath(os.getcwd()),
            self._config["server"]["static_path"])

        cherrypy.engine.subscribe('stop', self._on_stop)

        self._init_users()

    def start(self):
        """ Starts the application server. """
        cherrypy.engine.start()
        cherrypy.engine.block()

    def _on_stop(self):
        """ On stop handler to wait for the thread pool to exit. """
        self._pool.join()

    @property
    def store(self):
        return self._store

    @property
    def thread_pool(self):
        return self._pool

    @property
    def config(self):
        return self._config

    def _cherry_config(self):
        return {
            '/': {
                # 'tools.sessions.on': True,
                'tools.staticdir.root': os.path.abspath(os.getcwd()),
                'tools.staticdir.on': True,
                'tools.staticdir.dir': self._config["server"]["static_path"],
                'tools.staticdir.index': 'index.html',
                'tools.encode.on': True,
                'tools.encode.encoding': 'utf-8',
                'error_page.default': send_json_error,
            },
        }

    @cherrypy.expose()
    def default(self, *args):
        """ Serve the static index. """
        return cherrypy.lib.static.serve_file(os.path.join(self._static_root, "index.html"))

    @cherrypy.expose(alias="apiConfig.json")
    @cherrypy.tools.json_out()
    def config_json(self):
        return {
            "apiURL": ""  # use the HTTP origin
        }

    def _init_users(self):
        self._store.users.refresh_users()

