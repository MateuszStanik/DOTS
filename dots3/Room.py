import uuid
from dots3 import *

class Room:

    def __init__(self, id, name, passwd):
        self.id = id
        self.name = name
        self.passwd = passwd
        self.game = Game()
        self.game.set_settings(2, 3)
        self.game.start_game()
        self.players = {}

    @staticmethod
    def create(name, passwd):
        id = str(uuid.uuid1())
        return Room(id, name, passwd)

    @staticmethod
    def is_valid_name(name):
        return len(name) >= 1

    @staticmethod
    def is_valid_passwd(passwd):
        return len(passwd) >= 0

    def is_passwd(self, passwd):
        return self.passwd == passwd

    def has_passwd(self):
        return len(self.passwd) > 0

    def join(self, session):
        session['room'] = self.id
        self.players[session['sid']] = session['nick']

    def leave(self, session):
        del session['room']
        del self.players[session['sid']]

    def n_of_players(self):
        return len(self.players)
