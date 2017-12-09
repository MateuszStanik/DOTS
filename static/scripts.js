$(document).ready(function(){
    if ($('body').attr('id') == 'room') {
        var socket = io.connect('http://' + document.domain + ':' + location.port);
        socket.on('connect', function() {
            console.log('Connected!');
        });
    }
});

