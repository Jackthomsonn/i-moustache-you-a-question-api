var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

class Application {
  constructor() {
    server.listen(process.env.PORT || 8080, () => {
      console.log('Listening..')
    });
    
    app.get('/', (req, res) => {
      res.status(200).send('Hello')
    })
    
    io.on('connection', function (socket) {
      console.log('Socket connected ' + socket.id)
    });
  }
}

module.exports = new Application()