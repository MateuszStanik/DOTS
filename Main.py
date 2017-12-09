import os
import uuid
from pprint import pprint
from flask import Flask, render_template, session, redirect, url_for, escape, request, flash, session
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
        return redirect(url_for('game'))
    return render_template('index.html', body='listrooms', rooms=rooms.get_all())

@app.route('/createroom', methods=['POST'])
def createroom():
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' in session:
        return redirect(url_for('game'))
    name = request.form['name']
    passwd = request.form['passwd']
    if Room.is_valid_name(name) and Room.is_valid_passwd(passwd):
        room = Room.create(name, passwd)
        room.join(session)
        rooms.add_room(room)
        return redirect(url_for('game'))
    flash('Nieprawidlowe parametry pokoju')
    return redirect(url_for('listrooms'))

@app.route('/join/<string:room_id>', methods=['POST'])
def join(room_id):
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' in session:
        return redirect(url_for('game'))
    if rooms.exists(room_id):
        room = rooms.get(room_id)
        if not room.has_passwd() or room.is_passwd(request.form['passwd']):
            room.join(session)
            return redirect(url_for('game'))
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

@app.route('/game', methods=['GET'])
def game():
    if 'nick' not in session:
        return redirect(url_for('welcome'))
    if 'room' not in session:
        return redirect(url_for('listrooms'))
    room = rooms.get(session['room'])
    game = room.game
    return render_template('index.html', body='game', room=room, game=game)

if __name__ == '__main__':
    socket.run(app, debug=True, host='localhost')
