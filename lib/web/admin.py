""" Admin API controller """

from collections.abc import Mapping
import logging
import cherrypy
import cherrypy_cors

from ..aws.tasks import ChangeUserPassword
from ..model.student_users import StudentAccountException
from ..aws.utils import get_aws_url

from ._utils import send_json_error

TASK_TIMEOUT = 30  # seconds


class AdminController():
    """ CherryPy handler for the /admin API. """

    def __init__(self, app):
        self._app = app
        self._store = app.store
        self._log = logging.getLogger("AdminController")

        cherrypy.tree.mount(self, "/admin", self._cherry_config())

    def _cherry_config(self):
        return {
            "/": {
                'error_page.default': send_json_error,
                'cors.expose.on': True,
            }
        }

    def _check_authorization(self):
        """ Check the authentication token of the admin. """
        auth_token = cherrypy.request.headers.get("X-Auth-Token", None)
        if not self._store.admin.check_auth_token(auth_token):
            raise cherrypy.HTTPError(401, "Not Authenticated")

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
    def check(self):
        """ Checks the admin's token and returns whether it's still valid. """
        if cherrypy.request.method == 'OPTIONS':
            cherrypy_cors.preflight(allowed_methods=['GET', 'POST'])
            return
        # actually, the _check_authorization tool will handle it
        self._check_authorization()
        return {"success": True}

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
    def login(self):
        """ Authenticates the administrator """
        if cherrypy.request.method == 'OPTIONS':
            cherrypy_cors.preflight(allowed_methods=['GET', 'POST'])
            return

        if cherrypy.request.method != "POST":
            raise cherrypy.HTTPError(400, "Invalid request (%s)" % cherrypy.request.method)
        args = cherrypy.request.json
        if not isinstance(args, Mapping) or "username" not in args or "password" not in args:
            raise cherrypy.HTTPError(400, "Invalid request data")

        auth_token = self._store.admin.authenticate(args["username"], args["password"])
        if not auth_token:
            raise cherrypy.HTTPError(400, "Wrong admin username or password")

        self._log.info("New admin authenticated from IP %s", cherrypy.request.remote.ip)

        return {
            "auth_token": auth_token
        }


