""" Implements the main CherryPy web application class.  """

import os
import cherrypy


class AwsWebApp():
    """ Implements the web endpoint """

    def __init__(self, thread_pool):
        self._pool = thread_pool
        cherrypy.engine.subscribe('stop', self._on_stop)

    def _on_stop(self):
        # shutdown the threads
        self._pool.join()

    @cherrypy.expose
    def index(self):
        return "Hello world!"


def webapp_start(thread_pool):
    conf = {
        '/': {
            'tools.sessions.on': True,
            'tools.staticdir.root': os.path.abspath(os.getcwd())
        },
        '/static': {
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './static'
        }
    }
    cherrypy.quickstart(AwsWebApp(thread_pool=thread_pool), "", conf)

