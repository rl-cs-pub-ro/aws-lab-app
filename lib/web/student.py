""" Student accounts API controller """

from collections.abc import Mapping
import logging
import cherrypy
import cherrypy_cors

from ..model.student_users import StudentAccountException
from ..aws.utils import get_aws_url

from ._utils import send_json_error

TASK_TIMEOUT = 30  # seconds


class StudentController():
    """ CherryPy handler for the /student API. """

    def __init__(self, app):
        self._app = app
        self._store = app.store
        self._log = logging.getLogger("StudentController")

        cherrypy.tree.mount(self, "/student", self._cherry_config())

    def _cherry_config(self):
        return {
            "/": {
                'error_page.default': send_json_error,
                'cors.expose.on': True,
                'tools.json_in.on': True,
                'tools.json_out.on': True,
            }
        }

    @cherrypy.expose()
    def default(self, *args):
        return self._app.default()
    default._cp_config = {"tools.json_out.on": False}

    @cherrypy.expose()
    def check(self):
        """ Checks the user's token and returns its password + extra data. """
        if cherrypy.request.method == 'OPTIONS':
            cherrypy_cors.preflight(allowed_methods=['GET', 'POST'])
            return
        if cherrypy.request.method != "POST":
            raise cherrypy.HTTPError(400, "Invalid request (%s)" % cherrypy.request.method)
        args = cherrypy.request.json
        user_obj = self._check_user(args)
        return self._get_extra_creds(user_obj)

    @cherrypy.expose(alias="newCredentials")
    def new_credentials(self):
        if cherrypy.request.method == 'OPTIONS':
            cherrypy_cors.preflight(allowed_methods=['GET', 'POST'])
            return
        if cherrypy.request.method != "POST":
            raise cherrypy.HTTPError(400, "Invalid request (%s)" % cherrypy.request.method)
        args = cherrypy.request.json
        if not isinstance(args, Mapping) or "labPassword" not in args:
            raise cherrypy.HTTPError(400, "Invalid request data")
        if not self._store.lab.check_password(args["labPassword"]):
            raise cherrypy.HTTPError(400, "Wrong lab password")

        try:
            user_obj = self._store.users.allocate_user()
        except StudentAccountException as exc:
            self._log.warn("User allocation failed")
            raise cherrypy.HTTPError(500, str(exc))

        self._log.info("Allocated user: %s", user_obj.username)

        return self._get_extra_creds(user_obj)

    def _check_user(self, args):
        if not isinstance(args, Mapping) or "username" not in args:
            raise cherrypy.HTTPError(400, "Invalid request data")

        user_obj = self._store.users.get_user(args["username"])
        if not user_obj:
            raise cherrypy.HTTPError(400, "User not found: %s" % args["username"])
        if not user_obj.alloc_token or user_obj.alloc_token != args["token"]:
            raise cherrypy.HTTPError(400, "Invalid token for %s" % args["username"])
        return user_obj

    def _get_extra_creds(self, user_obj):
        """ Returns an object with user credentials + extra data (URL). """
        return {
            "username": user_obj.username,
            "token": user_obj.alloc_token,
            "password": user_obj.password,
            "url": get_aws_url(self._app.config["aws"]),
        }

