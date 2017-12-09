import uuid

class Users:

    def __init__(self):
        self.users = []

    def login(self, session_id, nick):
        self.users[session_id] = (session_id, nick)

    def logout(self, session_id):
        del self.users[session_id]

    def get(self, session_id):
        return self.users[session_id]
