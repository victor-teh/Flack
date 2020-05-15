import os

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels={}  
channels['General']=[] 
# list of all channels except General
channelsList=[]

@app.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")

@socketio.on("add channel")
def add_channel(data):
    channel_name = data["channel_name"]
    emit("update channel", {"channel_name": channel_name}, broadcast=True)
