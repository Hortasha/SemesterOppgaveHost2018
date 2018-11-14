var port = 3000;
var express = require('express');
var socket = require('socket.io');

//App setup
var app = express();
var server = app.listen(port, function() {
  console.log('listening on *:3000');
})

//static files
app.use(express.static('public'));

//Socket setup
var io = socket(server);

//Game Variables
var games = [];


io.on('connection', function(socket) {
  console.log('connected', socket.id);

  socket.on('disconnect', function(){
    console.log('user disconnected', socket.id);
  });

  socket.on('createGame', function(data) {
    var result = createGame(data);
    if(result) {

    } else {
      socket.emit('createGameFail', data);
    }
  });
});

/**
 ** Functions
 **/

//Attempt to create game
function createGame(data) {
  if (data.name === "") {
    return false;
  }
  for(var i = 0; i < games.length; i++) {
    if(data.name === games[i].name) {
      return false;
    }
  }
  games.push(new Game(data.name, data.type));
  return true;
}

/**
 ** Classes
 **/

 class Game {
   constructor(name, type) {
     this.name = name;
     this.type = type;
     this.lobby = true;
     this.board = {};
     this.players = [];
     this.dices = 1;
   }
 }
