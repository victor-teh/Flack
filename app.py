import os

from flask import Flask, session, render_template, request
from flask_session import Session
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == 'GET':
        # if first time user, prompt to type display name
        if session.get("display_name") is None:
            return render_template("index.html")
        else:
            return render_template("index.html", display_name=session["display_name"])
    else:
        # get display_name
        display_name = request.form.get("display_name").strip()
        if display_name == "":
            message = "Invalid Display Name, Please try again."
            return render_template("index.html", danger_message=message)
        else:
            session["display_name"] = display_name
            return render_template("index.html", display_name=session["display_name"])
