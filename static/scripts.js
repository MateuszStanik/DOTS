var log = console.log.bind(console);

function Board(id)
{
    var self = this;

    this.board = $('.board');
    this.width = Number(this.board.attr('data-width'));
    this.height = Number(this.board.attr('data-height'));

    this.board.css('width', this.width);
    this.board.css('height', this.height);

    this.rows = Number(this.board.attr('data-rows'));
    this.cols = Number(this.board.attr('data-cols'));

    this.w = this.width / (this.cols - 1);
    this.h = this.height / (this.rows - 1);
    this.n = this.rows * this.cols;

    this.dotTpl = $('<div></div>').addClass('board-dot');
    this.lineTpl = $('<div></div>').addClass('board-line');
    this.fillTpl = $('<div></div>').addClass('board-fill');

    this.hint = undefined;

    this.board.on('click', function (e) {
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
            if (json.ok && json.res.line) {
                var no0 = json.res.deltaBoard.lines[0][0];
                var no1 = json.res.deltaBoard.lines[0][1];
                self.drawLine(no0, no1);
            }
        }).fail(function() {
            log('Failed "ajax/putline" request');
        });
    });

    this.board.on('mousemove', function (e) {
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

    this.drawDot = function (no) {
        var i = Math.floor(no / this.cols);
        var j = no % this.cols;
        var x = j * this.w;
        var y = i * this.h;
        var dot = this.dotTpl.clone().attr('data-no', no).attr('data-x', x).attr('data-y', y).css('bottom', y + 'px').css('left', x + 'px');
        this.board.append(dot);

        return dot;
    }

    this.drawLine = function (no0, no1) {
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
        var length = dir == 'horizontal' ? this.w : this.h;
        var x = a.attr('data-x') - 1;
        var y = a.attr('data-y') - 1;
        var line = this.lineTpl.clone().addClass('board-line-' + dir).attr('data-no0', no0).attr('data-no1', no1).css('width', length + 'px').css('bottom', y + 'px').css('left', x + 'px');
        this.board.append(line);

        return line;
    }

    this.drawHint = function(no0, no1) {

        return this.drawLine(no0, no1).addClass('board-line-hint');
    }

    this.drawFill = function (no, type) {

        return this.fillTpl.clone().addClass('board-fill-' + type).attr('data-no', no);
    }

    this.getLine = function (no0, no1) {
        var line = $('div.board-line[data-no0="' + Math.min(no0, no1) + '"][data-no1="' + Math.max(no0, no1) + '"]');

        return line.length > 0 ? line : undefined;
    }

    this.getXY = function(e) {
        var x = Number(Math.max(Math.min(e.pageX - $(e.currentTarget).offset().left, this.width - 0.001), 0));
        var y = Number(Math.max(Math.min(this.height - (e.pageY - $(e.currentTarget).offset().top), this.height - 0.001), 0));

        return {
            'x' : x,
            'y' : y,
        };
    }

    this.getSurrounding = function(x, y) {
        var i = Math.floor(y / this.h);
        var yBottom = y % this.h;
        var yTop = this.h - yBottom;
        var dy = Math.min(yBottom, yTop);

        var j = Math.floor(x / this.w);
        var xLeft = x % this.w;
        var xRight = this.w - xLeft;
        var dx = Math.min(xLeft, xRight);

        var no0, no1;
        if (dx < dy) {
            // vertical line
            if (xRight < xLeft) {
                // right
                no0 = i * this.cols + j + 1;
                no1 = no0 + this.cols;
            } else {
                // left
                no0 = i * this.cols + j;
                no1 = no0 + this.cols;
            }
        } else {
            // horizontal line
            if (yTop < yBottom) {
                // top
                no0 = (i + 1) * this.cols + j;
                no1 = no0 + 1;
            } else {
                // bottom
                no0 = i * this.cols + j;
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

    this.init = function () {
        var no = 0;
        for (i = 0; i < this.rows; i++) {
            for (j = 0; j < this.cols; j++) {
                this.drawDot(no++);
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

