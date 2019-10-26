""" Configures the applicaiton logging. """

import logging
import logging.config
import cherrypy


LOG_CONF = {
    'version': 1,

    'formatters': {
        'void': {
            'format': ''
        },
        'file': {
            'format': '[%(asctime)s] %(message)s',
            'datefmt': '%Y/%d/%m %H:%M:%S',
        },
    },
    'handlers': {
        'default': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stdout'
        },
    },
    'root': {
        'handlers': ['default'],
        'level': 'INFO'
    },
    'loggers': {
        'cherrypy.access': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': False
        },
        'cherrypy.error': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': False
        },
    }
}

def configure_logging():
    logging.basicConfig()
    logging.getLogger().setLevel(logging.INFO)
    cherrypy.config.update({'log.screen': False,
                            'log.access_file': '',
                            'log.error_file': ''})

