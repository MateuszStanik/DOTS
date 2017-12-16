from pprint import pprint
from dots3 import *

class Game:

    def __init__(self):
        self.isStarted = False
        self.set_settings(10, 10)

    def set_settings(self, rows, cols):
        self.rows = rows
        self.cols = cols
        self.n = rows * cols
        self.max_lines = (rows - 1) * cols + (cols - 1) * rows

    def start_game(self):
        self.lines = {}
        self.currentPlayer = 'A'
        self.score = {'A' : 0, 'B' : 0}
        self.isStarted = True

    def has_ended(self):
        return len(self.lines) == self.max_lines

    def play_put_line(self, x, y, s):
        no0 = s['no0']
        no1 = s['no1']

        if s['d'] > 8:
            return { 'playAccepted' : False }

        line = (no0, no1)
        if line in self.lines:
            return { 'playAccepted' : False }

        if not (no0 == no1 - 1 or no0 == no1 - self.cols):
            return { 'playAccepted' : False }

        self.lines[line] = True

        a = b = c = d = None
        if no0 == no1 - 1:
            # horizontal line
            if no0 >= self.cols:
                # bottom
                a = no0 - self.cols
                b = no1 - self.cols
            if no1 < self.n - self.cols:
                # top
                c = no0 + self.cols
                d = no1 + self.cols
        else:
            # vertical line
            if no0 % self.cols > 0:
                # left
                a = no0 - 1
                b = no1 - 1
            if (no0 + 1) % self.cols > 0:
                # right
                c = no0 + 1
                d = no1 + 1

        closedSquareAB = closedSquareCD = False
        if not a == None:
            # bottom / left square
            closedSquareAB = ((a, b) in self.lines) and ((a, no0) in self.lines) and ((b, no1) in self.lines)
        if not c == None:
            # top / right square
            closedSquareCD = ((c, d) in self.lines) and ((no0, c) in self.lines) and ((no1, d) in self.lines)

        self.score[self.currentPlayer] += closedSquareAB + closedSquareCD

        nextPlayer = 'B' if self.currentPlayer == 'A' else 'A'

        hasEnded = self.has_ended()

        ret = {
            'playAccepted'  : True,
            'currentPlayer' : self.currentPlayer,
            'hasEnded'      : hasEnded,
            'deltaBoard'    : {
                'lines'     : [
                    (no0, no1)
                ],
                'squares'   : [],
            }
        }
        ret['score' + self.currentPlayer] = self.score[self.currentPlayer]
        if hasEnded:
            ret['winner'] = 'draw' if self.score['A'] == self.score['B'] else 'A' if self.score['A'] > self.score['B'] else 'B'
        else:
            ret['nextPlayer'] = nextPlayer
        if closedSquareAB:
            ret['deltaBoard']['squares'].append(a)
        if closedSquareCD:
            ret['deltaBoard']['squares'].append(no0)

        self.currentPlayer = nextPlayer

        return ret


