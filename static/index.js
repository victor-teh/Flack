$(function () {
    // document ready 
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    privateWindow = false;
    inRoom = false;
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
        // sending messages when user press enter
        $('#messageInput').on("keyup", function (key) {
            if (key.keyCode == 13) {
                $('#messageInputButton').click();
            }
        });
        $("#messageInputButton").on('click', function () {
            activeChannel = $("#channelList .active").attr('id');
            //broadcast to all
            if ($.trim($('#messageInput').val()) != "" && !privateWindow && !inRoom) {
                const mymessage = $('#messageInput').val();
                const username = localStorage.getItem('username');
                const time = new Date().toLocaleString();
                $('#messageInput').val("")
                socket.emit('submit to all', { 'mymessage': mymessage, 'username': username, 'time': time });
            }//send to room
            if ($.trim($('#messageInput').val()) != "" && !privateWindow && inRoom) {
                const mymessage = $('#messageInput').val();
                const username = localStorage.getItem('username');
                const time = new Date().toLocaleString();
                $('#messageInput').val("")
                socket.emit('submit to room', { 'channel': activeChannel, 'mymessage': mymessage, 'username': username, 'time': time });
                //send private
            } else if ($.trim($('#messageInput').val()) != "" && privateWindow && !inRoom) {
                const mymessage = $('#messageInput').val();
                const username = localStorage.getItem('username');
                const username2 = localStorage.getItem('activeMessage');
                const time = new Date().toLocaleString();
                $('#messageInput').val("")
                socket.emit('private', { 'mymessage': mymessage, 'username': username, 'time': time, 'username2': username2 });
            }
            $('#messageInput').val("")
        })

    })

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
                $('.channel_msg').addClass('text-danger');
                $('.channel_msg').text(data["error"]);
                $('.add_channel').val("");
            }, 900);
        } else {
            $('.channel_msg').addClass('text-success');
            $('.channel_msg').text("");
            $('.add_channel').val("");
            appendChannel(data['channel']);
            $('#channelList li:last').addClass('active');
            $('#channelList li:last').click();
            // inRoom = true;
            var removeHash = $('#channelList li:last').text().slice(1);
            localStorage.setItem('activeChannel', removeHash);
            $('#channelList').scrollTop(500000);
            $('#messageInput').focus();
            socket.emit('update users channels', { 'channel': data['channel'] });
        }
    });
    // Load channel
    socket.on('load channels', data => {
        $('#channelList li').remove();
        loadChannels(data);
        $('#' + localStorage.getItem('activeChannel')).click();
    });
    socket.on('update channels', data => {
        if ($('#' + data['channel']).length == 0) {
            appendChannel(data['channel']);
        }
    });
    socket.on('joined', data => {
        loadMessages(data);
        $('#messageInput').focus();
        $('.text-danger').on('click', function () {
            chooseUser($(this).text());
        });
    });

    socket.on('left', data => {
        loadMessages(data);
    });


    socket.on('announce to all', data => {
        if (!privateWindow) {
            loadMessages(data);
        }

        $('.text-danger').on('click', function () {
            chooseUser($(this).text());
        });
    });

    socket.on('announce to room', data => {
        loadMessages(data);
        $('.text-danger').on('click', function () {
            chooseUser($(this).text());
        });
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
    const div2 = document.createElement('div');
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
function loadMessages(data) {
    $('#messages').html("");
    for (x in data['channels'][activeChannel]) {
        const div = document.createElement('div');
        const div2 = document.createElement('div');
        const nameSpan = document.createElement('span');
        const p = document.createElement('p');
        const timeSpan = document.createElement('span');
        nameSpan.innerHTML = data['channels'][activeChannel][x]['username']
        p.innerHTML = data['channels'][activeChannel][x]['text']
        timeSpan.innerHTML = data['channels'][activeChannel][x]['time'];

        if (data['channels'][activeChannel][x]['username'] == localStorage.getItem('username')) {
            div.className = 'd-flex justify-content-end mb-4';
            div2.className = 'msg_cotainer_send';
            nameSpan.className = 'font-weight-bold text-success';
            timeSpan.className = 'msg_time_send';
        } else {
            div.className = 'd-flex justify-content-start mb-4';
            div2.className = 'msg_cotainer';
            nameSpan.className = 'font-weight-bold text-danger';
            timeSpan.className = 'msg_time';
        }

        p.className = 'm-0';

        $('#messages').append(div);
        div.append(div2);
        div2.append(nameSpan);
        div2.append(p);
        div2.append(timeSpan);

        $('#messages').scrollTop(500000);
    }
}
function chooseUser(user) {
    if (user != localStorage.getItem('username')) {
        const username = localStorage.getItem('username');
        const time = new Date().toLocaleString();
        activeChannel = localStorage.getItem('activeChannel');
        privateWindow = true;
        inRoom = false;
        $('#messages').html("");
        localStorage.setItem('activeMessage', user);
        if (activeChannel != "General") {
            socket.emit('leave', { 'channel': activeChannel, 'mymessage': 'has left the room', 'username': username, 'time': time });
        }
    } else {

    }
    $('#messageInput').focus();
}