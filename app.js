var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT || 8080);

io.on('connection', function (socket) {
  console.log('Socket connected ' + socket.id)
});