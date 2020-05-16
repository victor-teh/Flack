import os

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels = {}
channels["General"] = []
# list of all channels except General
channelsList = []
privateMessages = {}
usersList = {}
limit = 100


@app.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")

@socketio.on('connect')
def connect():
    emit("load channels",{'channels':channels})
    

@socketio.on('new username')
def new_username(data):
    username=""
    error=""
    if data['username'] in usersList:
        error="Username already exist. Try again"
    else:
        usersList[data['username']]=request.sid
        username=data["username"]
    emit("add username",{"username":username,'error':error})

@socketio.on('new channel')
def new_channel(data):
    error=""
    if data["channel"] in channelsList or data['channel']=="General":
        error="Channel already exist. Try again."
    elif data["channel"][0].isdigit():
        error="Channel name cannot start with a number"   
    elif ' ' in data['channel']:
        error="Channel name can't contain space"  
    else:
        channelsList.append(data['channel'])
        #create place for future messages
        channels[data["channel"]]=[]
    emit("add channel",{'channel':data["channel"],'error':error})

@socketio.on('leave')
def leave(data):
    room = data["channel"]
    leave_room(room)
    message={'text':data["mymessage"],'username':data['username'],"time":data['time']}
    channels[data["channel"]].append(message)
    if (len(channels[data["channel"]])>limit):
        channels[data["channel"]].pop(0)
    emit("left",{'channels':channels},room=room)

@socketio.on('join')
def join(data):
    room = data["channel"]
    join_room(room)
    message={'text':data["mymessage"],'username':data['username'],"time":data['time']}
    channels[data["channel"]].append(message)
    if (len(channels[data["channel"]])>limit):
        channels[data["channel"]].pop(0)
    emit("joined",{'channels':channels},room=room)

@socketio.on('come back to general')
def come_back_to_general():
    emit("announce to all",{'channels':channels},broadcast=True)

