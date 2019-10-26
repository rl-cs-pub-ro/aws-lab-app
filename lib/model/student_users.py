""" Implements the student account collection classes. """

import string
import random


class StudentAccountCollection():
    """ Implements the student accounts model collection. """

    def __init__(self, initialUsers):
        self._users = {}
        self.load(initialUsers)

    def load(self, usersList, no_replace=False):
        """ Loads the users (from file / AWS API). """
        if not usersList:
            return
        for user in usersList:
            if not isinstance(user, StudentAccount):
                # for the initial users list (given as strings)
                if isinstance(user, str):
                    user = {"username": user}
                user = StudentAccount(**user)
            username = user.username
            if username in self._users and no_replace:
                continue

            self._users[username] = user

    def get_user(self, username):
        """ Returns a specific user's object. """
        if username not in self._users:
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

    def export(self):
        """ Exports all user accounts as list of standard objects (for
        persisting). """
        return [user.export() for user in self._users.values()]


class StudentAccount():
    """ Encapsulates student account state. """
    __slots__ = ("username", "password", "alloc_token")

    def __init__(self, **user):
        self.username = user.get("username")
        self.password = user.get("password", None)
        self.alloc_token = user.get("allocatedToken", None)

    def reset(self):
        """ Resets the user to unallocated state. """
        self.password = None
        self.alloc_token = None

    def export(self):
        """ Export the user as standard object. """
        return {"username": self.username, "password": self.password,
                "allocatedToken": self.alloc_token}


class StudentAccountException(Exception):
    pass

