from dots3 import *

class Game:

    def __init__(self):
        # self.board = Board()
        return

    def click(self, x, y, s):
        r = {}
        r['nextPlayer'] = 'A'
        r['no0'] = s['no0']
        return r
