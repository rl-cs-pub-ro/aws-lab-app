""" Implements the student account collection classes. """

import string
import random


class StudentAccountCollection():
    """ Implements the student accounts model collection. """

    def __init__(self, initialUsers):
        self._users = {}
        self.load_persisted(initialUsers)

    def load_persisted(self, users):
        """ Loads users' persisted properties (allocation token and password). """
        if not users:
            return
        for user in users:
            user_obj = self.get_user(user["username"], create=True)
            user_obj.password = user.get("password", None)
            user_obj.alloc_token = user.get("allocatedToken", None)

    def load_aws(self, aws_users):
        """ Loads the users' stats from the AWS API. """
        if not aws_users:
            return
        for user in aws_users:
            user_obj = self.get_user(user["username"], create=True)
            user_obj.update_stats(last_used=user.get("last_used", None))

    def get_user(self, username, create=False):
        """ Returns a specific user's object (creates it if it doesn't exist). """
        if username not in self._users:
            if create:
                user_obj = StudentAccount(username=username)
                self._users[username] = user_obj
            else:
                raise StudentAccountException("User '%s' not found" % username)
        return self._users[username]

    def allocate_user(self):
        """ Allocates a new user and returns its data. Raises an exception if no
        empty accounts were found. """
        for user in self._users.values():
            if user.alloc_token:
                continue
            # generate a new token and password
            chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
            new_password = ''.join(random.choice(chars) for x in range(18))
            new_token = hex(random.getrandbits(128))[2:]
            user.alloc_token = new_token
            user.password = new_password
            return user

        raise StudentAccountException("no free accounts remaining")

    def reset_user(self, username):
        """ Deallocates (resets) an user. """
        if username not in self._users:
            raise StudentAccountException("User '%s' not found" % username)
        self._users[username].reset()

    def export(self, persistent=False):
        """ Exports all user accounts as list of standard objects (for
        persistence or web presentation). """
        return [user.export(persistent=persistent)
                for user in self._users.values()]


class StudentAccount():
    """ Encapsulates student account state. """
    __slots__ = ("username", "password", "alloc_token", "aws_stats")

    def __init__(self, **user):
        self.username = user.get("username")
        self.password = user.get("password", None)
        self.alloc_token = user.get("allocatedToken", None)
        self.aws_stats = user.get("awsStats", {})

    def reset(self):
        """ Resets the user to unallocated state. """
        self.password = None
        self.alloc_token = None
        
    def update_stats(self, **stats):
        """ Updates the AWS stats for the user. """
        self.aws_stats.update(stats)

    @property
    def allocated(self):
        return bool(self.alloc_token)

    def export(self, persistent=False):
        """ Export the user as standard object. """
        obj = {"username": self.username, "password": self.password,
               "allocatedToken": self.alloc_token}
        if not persistent:  # also export the non-persistent stats
            obj["awsStats"] = self.aws_stats

        return obj


class StudentAccountException(Exception):
    pass

