import os
import uuid
from pprint import pprint
from flask import Flask, render_template, session, redirect, url_for, escape, request, flash, session, jsonify
from flask_socketio import SocketIO
from dots3 import *

app = Flask(__name__)
app.secret_key = os.urandom(24)
socket = SocketIO(app)
rooms = Rooms()

@app.route('/', methods=['GET'])
def welcome():
    if 'nick' in session:
        return redirect(url_for('listrooms'))
    return render_template('index.html', body='welcome')

@app.route('/', methods=['POST'])
def login():
    if 'nick' in session:
        return redirect(url_for('listrooms'))
    if Misc.is_valid_nick(request.form['nick']):
        session['sid'] = str(uuid.uuid1())
        session['nick'] = request.form['nick']
        return redirect(url_for('listrooms'))
    flash('Nieprawidlowy nick')
    return redirect(url_for('welcome'))

@app.route('/listrooms', methods=['GET'])
def listrooms():
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' in session:
        return redirect(url_for('play'))
    return render_template('index.html', body='listrooms', rooms=rooms.get_all())

@app.route('/createroom', methods=['POST'])
def createroom():
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' in session:
        return redirect(url_for('play'))
    name = request.form['name']
    passwd = request.form['passwd']
    if Room.is_valid_name(name) and Room.is_valid_passwd(passwd):
        room = Room.create(name, passwd)
        room.join(session)
        rooms.add_room(room)
        return redirect(url_for('play'))
    flash('Nieprawidlowe parametry pokoju')
    return redirect(url_for('listrooms'))

# @app.route('/join/<string:roomId>', methods=['POST'])
@app.route('/join', methods=['POST'])
def join():
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' in session:
        return redirect(url_for('play'))
    if 'roomId' not in request.form:
        flash('Nie wybrano pokoju')
        return redirect(url_for('listrooms'))
    roomId = request.form['roomId']
    if rooms.exists(roomId):
        room = rooms.get(roomId)
        if not room.has_passwd() or ('roomPasswd' in request.form and room.is_passwd(request.form['roomPasswd'])):
            room.join(session)
            return redirect(url_for('play'))
        if not 'roomPasswd' in request.form:
            return render_template('index.html', body='joinpasswd', roomId=roomId)
        flash('Niepoprawne haslo')
        return redirect(url_for('listrooms'))
    flash('Pokoj nie istnieje')
    return redirect(url_for('listrooms'))

@app.route('/leave', methods=['POST'])
def leave():
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' not in session:
        return redirect(url_for('listrooms'))
    if rooms.exists(session['room']):
        room = rooms.get(session['room'])
        room.leave(session)
    else:
        flash('Pokoj nie istnieje')
    return redirect(url_for('listrooms'))

@app.route('/play', methods=['GET'])
def play():
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' not in session:
        return redirect(url_for('listrooms'))
    room = rooms.get(session['room'])
    game = room.game
    return render_template('index.html', body='play', room=room, game=game)


@app.errorhandler(405)
def method_not_allowed(e):
    return redirect(url_for('welcome'))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.route('/ajax/putline', methods=['POST'])
def ajax_put_line():
    if 'room' not in session:
        return jsonify(ok=False, res="Missing room id")
    roomId = session['room']
    if not rooms.exists(roomId):
        return jsonify(ok=False, res="No such room")
    room = rooms.get(roomId)
    game = room.game
    if not game.isStarted:
        return jsonify(ok=False, res="Game not started")
    if game.has_ended():
        return jsonify(ok=False, res="Game has ended")
    if 'x' not in request.json or 'y' not in request.json or 's' not in request.json:
        return jsonify(ok=False, res="Missing request parameters")
    x = request.json['x']
    y = request.json['y']
    s = request.json['s']

    res = game.play_put_line(x, y, s)

    return jsonify(ok=True, res=res)


if __name__ == '__main__':
    socket.run(app, debug=True, host='localhost')
