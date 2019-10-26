""" Cherrypy extensions. """

import json

import cherrypy


def send_json_error(status, message, traceback, version):
    """
    Sends a HTTP error as JSON if Accept is application/json.
    """
    response = cherrypy.serving.response
    if cherrypy.serving.request.headers.get("Accept") != "application/json":
        # revert to the old html template
        template = cherrypy._cperror._HTTPErrorTemplate
        response.headers['Content-Type'] = 'text/html;charset=utf-8'
        result = template % {
            "status": status, "message": message,
            "traceback": "", "version": ""
        }
        return result.encode('utf-8')

    response.headers["Content-Type"] = "application/json"
    response.status = status
    return json.dumps({
        "status": status,
        "message": message,
    }).encode('utf-8')


