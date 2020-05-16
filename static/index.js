$(function () {
    // document ready 
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    // privateWindow = false;
    // inRoom = false;
    socket.on('connect', () => {
        // prompt for display name for first time user
        if (!localStorage.getItem("username")) {
            $("#myModal").modal({ backdrop: 'static', keyboard: false });
        } else {
            $("#welcome_header").text("Hi " + localStorage.getItem("username") + ", Welcome to Flack");
            $("#myModal").modal("hide")
        }
        $("#myModal").on("hidden.bs.modal", function () {
            if (!localStorage.getItem("username")) {
                $("#myModal").modal({ backdrop: 'static', keyboard: false });
            }
        })
        // modal Input check
        $("#modalInput").on('keyup', function (key) {
            if ($(this).val().length > 0) {
                $("#modalButton").attr('disabled', false);
            }
            else {
                $("#modalButton").attr('disabled', true);
            }
        });
        $("#modalInput").on('keydown', function (key) {
            if ($(this).val().length > 0) {
                $("#modalButton").attr('disabled', false);
                if (key.keyCode == 13) {
                    $('#modalButton').click();
                }
            }
        });
        // Request to add username (send to server)
        $("#modalButton").on("click", function () {
            var username = $("#modalInput").val();
            username = username.charAt(0).toUpperCase() + username.slice(1);
            socket.emit('new username', { 'username': username });

        });
        // Request to join channel
        $('#channelList').on('click', 'li', function () {
            $('#messageInput').focus();
            if (!localStorage.getItem('activeChannel')) {
                activeChannel = "General";
            } else {
                activeChannel = localStorage.getItem('activeChannel');
            }
            const username = localStorage.getItem('username');
            const time = new Date().toLocaleString();
            $(this).addClass('active');
            $(this).siblings().removeClass('active');
            $('#messages').html("");
            if (activeChannel != "General" && !privateWindow) {
                socket.emit('leave', { 'channel': activeChannel, 'mymessage': 'has left the room', 'username': username, 'time': time });
            }
            activeChannel = $("#channelList .active").attr('id');
            localStorage.setItem('activeChannel', activeChannel)
            if (activeChannel == 'General') {
                inRoom = false;
                privateWindow = false;
                return socket.emit('come back to general');
            } else {
                inRoom = true;
                privateWindow = false;
            }
            socket.emit('join', { 'channel': activeChannel, 'mymessage': 'has entered the room', 'username': username, 'time': time });
        });
        // Request to Add channel
        $(".add_channel_btn").on('click', function () {
            var channelName = $('.add_channel').val();
            channelName = channelName.charAt(0).toUpperCase() + channelName.slice(1);
            socket.emit('new channel', { 'channel': channelName });

        });
    })
    // Load channel
    socket.on('load channels', data => {
        $('#channelList li').remove();
        loadChannels(data);
        $('#' + localStorage.getItem('activeChannel')).click();
    });

    // Respond to add username (receive from server)
    socket.on('add username', data => {
        if (data["error"] != "") {
            window.setTimeout(function () {
                $("#myModal").modal({ backdrop: 'static', keyboard: false });
                $('.modal-title').text(data["error"]);
                $('#modalInput').val("");
                $("#modalButton").attr('disabled', true);
            }, 900);
        } else {
            localStorage.setItem('username', data["username"]);
            $('#username').text(localStorage.getItem('username'));
            $("#welcome_header").text("Hi " + localStorage.getItem('username') + ", Welcome to Flack");
            $("#myModal").modal("hide")
            $('#General').click();
            $('#messageInput').focus();
        }
    });
    // Respond to add channel
    socket.on('add channel', data => {
        if (data["error"] != "") {
            window.setTimeout(function () {
                $('.channel_error').text(data["error"]);
                $('.add_channel').val("");
            }, 900);
        } else {
            appendChannel(data['channel']);
            $('#channelList li:last').addClass('active');
            $('#channelList li:last').click();
            inRoom = true;
            var removeHash = $('#channelList li:last').text().slice(1);
            localStorage.setItem('activeChannel', removeHash);
            $('#channelList').scrollTop(500000);
            $('#messageInput').focus();
            socket.emit('update users channels', { 'channel': data['channel'] });
        }
    });
})
function loadChannels(data) {
    for (channel in data['channels']) {
        appendChannel(channel);
    }
}
function appendChannel(channel) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    const div2 = document.createElement('div2');
    const span = document.createElement('span');
    div.className = 'd-flex bd-highlight'
    div2.className = 'user_info'
    li.append(div);
    div.append(div2);
    div2.append(span);
    span.innerHTML = '#' + channel.charAt(0).toUpperCase() + channel.slice(1);
    li.setAttribute("id", channel);
    $('#channelList').append(li);
}