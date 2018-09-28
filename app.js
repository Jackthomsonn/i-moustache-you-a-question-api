var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var request = require('request');

const azureFunctionUrl = 'https://test-app-1900872.azurewebsites.net/api/HandlebarTrigger?code=g792XOQV4rMsdW1/iCFB2/zwFRcV55qBNV8ert7j7wnmfDIBZT4xLw=='
const games = [];


class Application {

  constructor() {
    server.listen(process.env.PORT || 8080, () => {
      console.log('Listening...')
    });
    
    app.get('/', (req, res) => {
      res.status(200).send('Hello')
    })
    
    io.on('connection', function (socket) {
      console.log('Socket connected ' + socket.id)

      socket.on('joinGame', (data) => {
        socket.join(data.roomName);
      });

      socket.on('leaveGame', (data) => {
        socket.on(disconnect);
      });

      socket.emit('liveGames', games);

      socket.on('addGame', (data) => {       
        request(azureFunctionUrl, function (error, response, body) {       
          games.push({
            gameName: data.gameName,
            players: [],
            questions: body
          });
          socket.join(data.gameName);
          io.emit('updateGames', games);
        });
      });

      socket.on('removeGame', (data) => {
        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName == data.gameName) {
            games.splice(i, 1);
          }
        }
      });

      socket.on('addPlayer', (data) => {
        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName == data.gameName) {
            games[i].players.push({
              playerName: data.playerName, 
              score: 0
            });
          }
        }
      });

      socket.on('removePlayer', (data) => {
        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName == data.gameName) {
            games[i].players.splice(i, 1);
          }
        }
      });

      socket.on('submitAnswer', (data) => {
        var game = null;
        var player = null;
        var question = null;

        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName == data.gameName) {
            game = games[i];
          }
        }

        if (game != null) {
          for (let j = 0; j < game.players.length; j ++) {
            if (game.players[j].playerName == data.playerName) {
              player = game.players[j];
            }
          }

          if (player != null) {
            for (let k = 0; k < game.questions.length; k ++) {
              if (game.questions[k].question == data.question) {
                question = game.questions[k];
                if (question.correct == data.answer) {
                  player.score ++;
                  io.emit('updatePlayerScore', player.playerName, player.score);
                }
              }
            }
          } else {
            Console.log('Player not found');
          }
        } else {
          Console.log('Game not found');
        }

      });

    });
  }
}

module.exports = new Application()