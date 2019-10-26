""" Student accounts API controller """

from collections.abc import Mapping
import logging
import cherrypy
import cherrypy_cors

from ..aws.tasks import ChangeUserPassword
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
            }
        }

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
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
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
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

        # set a new password using the AWS IAM API
        task = ChangeUserPassword(
            username=user_obj.username, new_password=user_obj.password,
            retry=3)
        # queue a task to set the user's password, but don't wait for it
        # we need to return the token ASAP
        self._app.thread_pool.queue_task(task)

        return self._get_extra_creds(user_obj)

    @cherrypy.expose(alias="resetPassword")
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def reset_password(self):
        """ Resets the password of the user. """
        if cherrypy.request.method == 'OPTIONS':
            cherrypy_cors.preflight(allowed_methods=['GET', 'POST'])
            return
        if cherrypy.request.method != "POST":
            raise cherrypy.HTTPError(400, "Invalid request (%s)" % cherrypy.request.method)
        args = cherrypy.request.json
        user_obj = self._check_user(args)
        self._store.users.change_password(user_obj.username)

        self._log.info("Password reset for user %s", user_obj.username)
        task = ChangeUserPassword(username=args["username"], retry=3)
        try:
            future = self._app.thread_pool.queue_task(task)
            # wait for completion
            future.result(timeout=TASK_TIMEOUT)
            # return the token
            return self._get_extra_creds(user_obj)

        except Exception as ex:
            raise cherrypy.HTTPError(500, "Error: %s" % str(ex))

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

