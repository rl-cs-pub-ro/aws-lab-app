""" Admin API controller """

from collections.abc import Mapping
import logging
import cherrypy
import cherrypy_cors

from ..aws.tasks import ChangeUserPassword
from ..model.student_users import StudentAccountException
from ..model.aws import AWSUsersManager
from ..aws.utils import get_aws_url

from ._utils import send_json_error, json_handler

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
                'tools.json_in.on': True,
                'tools.json_out.on': True,
                'tools.json_out.handler': json_handler,
            }
        }

    def _check_authorization(self):
        """ Check the authentication token of the admin. """
        auth_token = cherrypy.request.headers.get("X-Auth-Token", None)
        if not self._store.admin.check_auth_token(auth_token):
            raise cherrypy.HTTPError(401, "Not Authenticated")

    def _check_preflight(self):
        """ Checks for CORS preflight and returns from the request. """
        if cherrypy.request.method == 'OPTIONS':
            cherrypy_cors.preflight(allowed_methods=['GET', 'POST'])
            return True
        return False

    @cherrypy.expose()
    def default(self, *args):
        return self._app.default()
    default._cp_config = {"tools.json_out.on": False}

    @cherrypy.expose()
    def login(self):
        """ Authenticates the administrator """
        if self._check_preflight():
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

    @cherrypy.expose()
    def check(self):
        """ Checks the admin's token and returns whether it's still valid. """
        if self._check_preflight():
            return
        # actually, the _check_authorization tool will handle it
        self._check_authorization()
        return {"success": True}

    @cherrypy.expose(alias="getLabSettings")
    def get_lab_settings(self):
        """ Returns the current lab variables (e.g., password). """
        if self._check_preflight():
            return
        self._check_authorization()
        lab = self._store.lab.get_all_vars()
        return lab

    @cherrypy.expose(alias="getAwsUsers")
    def get_aws_users(self):
        """ Returns all AWS users. """
        if self._check_preflight():
            return
        self._check_authorization()

        users = self._store.users.refresh_users()
        return users

    @cherrypy.expose(alias="changeLabPassword")
    def change_lab_password(self):
        """ Changes the lab password. """
        if self._check_preflight():
            return
        self._check_authorization()

        if cherrypy.request.method != "POST":
            raise cherrypy.HTTPError(400, "Invalid request (%s)" % cherrypy.request.method)
        args = cherrypy.request.json

        if not isinstance(args, Mapping) or not args.get("labPassword", ""):
            raise cherrypy.HTTPError(400, "Invalid password!")
        self._store.lab.set_password(args["labPassword"])

        return {"success": True}

    # @cherrypy.expose(alias="customAllocateUsers")
    def custom_allocate_users(self):
        """ For testing purposes. """
        users = ["student35", "student36", "student37", "student38", "student39", "student40"]
        self._store.users.allocate_custom_users(users)

    @cherrypy.expose(alias="getAwsResources")
    def get_aws_resources(self):
        """ Returns all AWS users. """
        if self._check_preflight():
            return
        # self._check_authorization()

        resources = self._store.resources.refresh_resources()
        print(resources)
        return resources

