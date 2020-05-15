$(function () {
    // document ready 
    if (!localStorage.getItem('username'))
        $('#myModal').modal('show')
    else
        $('#welcome_header').text("Hi " + localStorage.getItem('username') + ", Welcome to Flack");

    $('#myModal').on('hidden.bs.modal', function () {
        if (!localStorage.getItem('username'))
            $('#myModal').modal('show')
    })
    $("#modalInput").on('keyup', function (key) {
        if ($(this).val().length > 0) {
            $("#modalButton").attr('disabled', false);
        } else {
            $("#modalButton").attr('disabled', true);
        }
    });
    $("#modalInput").on('keydown', function (key) {
        if ($(this).val().length > 0 && key.keyCode == 13) {
            $('#modalButton').click();
        }
    });
    $("#modalButton").on('click', function () {
        var username = $('#modalInput').val();
        username = username.charAt(0).toUpperCase() + username.slice(1);
        localStorage.setItem('username', username);
        $('#welcome_header').text("Hi " + username + ", Welcome to Flack");
        $('#myModal').modal('hide')
    });


});