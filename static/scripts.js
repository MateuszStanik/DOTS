var log = console.log.bind(console);

function Game()
{
    var self = this;

    self.currentPlayer = 'A'
}

function Board(id)
{
    var self = this;

    self.board = $('.board');
    self.width = Number(self.board.attr('data-width'));
    self.height = Number(self.board.attr('data-height'));

    self.board.css('width', self.width);
    self.board.css('height', self.height);

    self.rows = Number(self.board.attr('data-rows'));
    self.cols = Number(self.board.attr('data-cols'));

    self.w = self.width / (self.cols - 1);
    self.h = self.height / (self.rows - 1);
    self.n = self.rows * self.cols;

    self.dotTpl = $('<div></div>').addClass('board-dot');
    self.lineTpl = $('<div></div>').addClass('board-line');
    self.squareTpl = $('<div></div>').addClass('board-square').css('width', self.w).css('height', self.h);

    self.hint = undefined;

    self.board.on('click', function (e) {
        var xy = self.getXY(e);
        var s = self.getSurrounding(xy.x, xy.y);

        // if (self.hint) {
        //     self.hint.remove();
        // }

        $.ajax({
            type: "post",
            url: "ajax/putline",
            data: JSON.stringify({
                x       : xy.x,
                y       : xy.y,
                s       : s,
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
        }).done(function( json ) {
            log(json);
            if (!json.ok) {
                $('.notifs ul').prepend('<li>' + json.res + '</li>');
                return;
            }
            if (json.res.playAccepted) {
                self.updateBoard(json.res);
            }
        }).fail(function() {
            log('Failed "ajax/putline" request');
        });
    });

    self.board.on('mousemove', function (e) {
        var xy = self.getXY(e);
        var s = self.getSurrounding(xy.x, xy.y);

        if (self.hint) {
            self.hint.remove();
        }
        if (s.d > 8) {
            return;
        }
        if (!self.getLine(s.no0, s.no1)) {
            self.hint = self.drawHint(s.no0, s.no1);
        }
    });

    self.drawDot = function (no) {
        var i = Math.floor(no / self.cols);
        var j = no % self.cols;
        var x = j * self.w;
        var y = i * self.h;
        var dot = self.dotTpl.clone().attr('data-no', no).attr('data-x', x).attr('data-y', y).css('bottom', y + 'px').css('left', x + 'px');
        self.board.append(dot);

        return dot;
    }

    self.drawLine = function (no0, no1) {
        var a = $('div.board-dot[data-no="' + Math.min(no0, no1) + '"]');
        var b = $('div.board-dot[data-no="' + Math.max(no0, no1) + '"]');
        var dir;
        if (a.attr('data-no') == b.attr('data-no') - 1) {
            dir = 'horizontal';
        } else if (a.attr('data-no') == b.attr('data-no') - this.cols) {
            dir = 'vertical';
        } else {
            log('drawLine exception: invalid dots');
            return;
        }
        var length = dir == 'horizontal' ? self.w : self.h;
        var x = a.attr('data-x') - 1;
        var y = a.attr('data-y') - 1;
        var line = self.lineTpl.clone().addClass('board-line-' + dir).attr('data-no0', no0).attr('data-no1', no1).css('width', length + 'px').css('bottom', y + 'px').css('left', x + 'px');
        self.board.append(line);

        return line;
    }

    self.drawHint = function(no0, no1) {

        return self.drawLine(no0, no1).addClass('board-line-hint');
    }

    self.drawSquare = function (no, player) {
        var i = Math.floor(no / self.cols);
        var j = no % self.cols;
        var x = j * self.w;
        var y = i * self.h;
        var square = self.squareTpl.clone().addClass('board-square-' + player.toLowerCase()).attr('data-no', no).css('bottom', y + 'px').css('left', x + 'px');;
        self.board.append(square);

        return square;
    }

    self.getLine = function (no0, no1) {
        var line = $('div.board-line[data-no0="' + Math.min(no0, no1) + '"][data-no1="' + Math.max(no0, no1) + '"]');

        return line.length > 0 ? line : undefined;
    }

    self.getXY = function(e) {
        var x = Number(Math.max(Math.min(e.pageX - $(e.currentTarget).offset().left, self.width - 0.001), 0));
        var y = Number(Math.max(Math.min(self.height - (e.pageY - $(e.currentTarget).offset().top), self.height - 0.001), 0));

        return {
            'x' : x,
            'y' : y,
        };
    }

    self.getSurrounding = function(x, y) {
        var i = Math.floor(y / self.h);
        var yBottom = y % self.h;
        var yTop = self.h - yBottom;
        var dy = Math.min(yBottom, yTop);

        var j = Math.floor(x / self.w);
        var xLeft = x % self.w;
        var xRight = self.w - xLeft;
        var dx = Math.min(xLeft, xRight);

        var no0, no1;
        if (dx < dy) {
            // vertical line
            if (xRight < xLeft) {
                // right
                no0 = i * self.cols + j + 1;
                no1 = no0 + self.cols;
            } else {
                // left
                no0 = i * self.cols + j;
                no1 = no0 + self.cols;
            }
        } else {
            // horizontal line
            if (yTop < yBottom) {
                // top
                no0 = (i + 1) * self.cols + j;
                no1 = no0 + 1;
            } else {
                // bottom
                no0 = i * self.cols + j;
                no1 = no0 + 1;
            }
        }

        return {
            'no0'   : no0,
            'no1'   : no1,
            'd'     : Math.min(dx, dy),
            'dx'    : dx,
            'dy'    : dy,
            'xLeft' : xLeft,
            'xRight': xRight,
            'yTop'  : yTop,
            'yBottom': yBottom,
            'i'     : i,
            'j'     : j,
        }
    }

    self.init = function () {
        var no = 0;
        for (i = 0; i < self.rows; i++) {
            for (j = 0; j < self.cols; j++) {
                self.drawDot(no++);
            }
        }
        //  SOCKETIO po wejsciu do pokoju
        // $.ajax({
        //     type: "post",
        //     url: "ajax/socketio",
        //     dataType: 'json',
        //     contentType: 'application/json; charset=utf-8',
        // }).done(function( json ) {
        //     log(json);
        //     if (!json.ok) {
        //         $('.notifs ul').prepend('<li>' + json.res + '</li>');
        //         return;
        //     }
        //     self.updateBoard(json.res);
        //     self.canPlay = json.res.canPlay;
        // }).fail(function() {
        //     log('Failed "ajax/putline" request');
        // });
    }

    self.updateBoard = function (res) {
        for (var i = 0; i < res.deltaBoard.lines.length; ++i) {
            var no0 = res.deltaBoard.lines[i][0];
            var no1 = res.deltaBoard.lines[i][1];
            self.drawLine(no0, no1);
        }
        for (var i = 0; i < res.deltaBoard.squares.length; ++i) {

            var no = res.deltaBoard.squares[i];
            log('square', no);
            self.drawSquare(no, res.currentPlayer);
        }
        if (res.scoreA) {
            $('.score-a').html(res.scoreA);
        }
        if (res.scoreB) {
            $('.score-b').html(res.scoreB);
        }
        if (res.nextPlayer) {
            $('.current-player').html(res.nextPlayer);
        }
        if (res.hasEnded) {
            if (res.winner == 'draw') {
                $('.results').html('Remis!')
            } else {
                $('.results').html('Wygrał gracz ' + res.winner)
            }
        }
    }
}


$(document).ready(function(){
    if ($('body').attr('id') == 'play') {
        var socket = io.connect('http://' + document.domain + ':' + location.port);
        socket.on('connect', function() {
            console.log('Connected!');
        });

        var board = new Board('theboard');

        board.init();
    }

});

