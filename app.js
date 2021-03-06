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
      const id = socket.id;

      socket.on('joinGame', (data) => {
        socket.join(data.gameName);

        console.log('Socket is joining game room')
          console.log(data.gameName)
        
        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName === data.gameName) {
            games[i].players.push({
              playerName: data.playerName, 
              playerId: id,
              score: 0
            });

            if (games[i].players.length === 3) {
              io.in(games[i].gameName).emit('startGame', games[i]);
            }
          }
        }
      });

      socket.on('disconnect', (data) => {
        var game = null;
        var player = null;

        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName === data.gameName) {
            game = games[i];
          }
        }

        if (game != null) {
          for (let i = 0; i < game.players.length; i ++) {
            if (game.players[i].playerName === data.playerName) {
              game.players.splice(i, 1);
            }
          }
        } else {
          console.log('Game not found');
        }
      });

      socket.emit('liveGames', games);

      socket.on('addGame', (data) => {       
        request(azureFunctionUrl, function (error, response, body) {
          console.log('QUESTIONS')
          console.log(body)
          games.push({
            gameName: data.gameName,
            players: [],
            playersAnswered: [],
            questions: body
          });

          for (let i = 0; i < games.length; i ++) {
            if (games[i].gameName === data.gameName) {
              games[i].players.push({
                playerName: data.playerName, 
                playerId: id,
                score: 0
              });
            }
          }

          console.log('Socket is joinign game room (Host)')
          console.log(data.gameName)

          socket.join(data.gameName);
          io.emit('updateGames', games);
        });
      });

      socket.on('removeGame', (data) => {
        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName === data.gameName) {
            games.splice(i, 1);
          }
        }
      });

      socket.on('removePlayer', (data) => {
        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName === data.gameName) {
            games[i].players.splice(i, 1);
          }
        }
      });

      socket.on('submitAnswer', (data) => {
        console.log('DATA')
        console.log(data)
        var game = null;
        var player = null;
        var question = null;

        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName === data.gameName) {
            game = games[i];
          }
        }

        console.log('GAME')
        console.log(game)

        if (game != null) {
          for (let j = 0; j < game.players.length; j ++) {
            if (game.players[j].playerName === data.playerName) {
              player = game.players[j];
            }
          }

          if (player != null) {
            for (let k = 0; k < game.questions.length; k ++) {
              if (game.questions[k].question === data.question) {
                question = game.questions[k];
                if (question.correct === data.answer) {
                  player.score ++;
                  io.emit('updatePlayerScore', player.playerName, player.score);
                }
              }
            }
            game.playersAnswered.push(player);
            console.log(game);
            console.log(game.players);
            console.log(game.playersAnswered);
            if (game.players.length === game.playersAnswered.length) {
              console.log('End of Round');
              io.emit('endOfRound', {done: true});
              game.playersAnswered = [];
            }
          } else {
            console.log('Player not found');
          }
        } else {
          console.log('Game not found');
        }

      });

      socket.on('endGame', (data) => {
        var game = null;
        var winner = null;

        for (let i = 0; i < games.length; i ++) {
          if (games[i].gameName === data.gameName) {
            game = games[i];
          }
        }

        if (game != null) {
          for (let j = 0; j < game.players.length; j ++) {
            if (winner == null || game.players[i].score > winner.score) {
              winner = game.players[i];
            }
          }
          io.emit('endGame', winner);
        } else {
          console.log('Game not found');
        }
      });
    });
  }
}

module.exports = new Application()