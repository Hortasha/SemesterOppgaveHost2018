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
var lobbys = [];

//Connected
io.on('connection', function(socket) {
//Connection data
  var room = "";
  var player = "";
  console.log('connected', socket.id);

//Disconnected
  socket.on('disconnect', function(){
    if(room !== "") {
      for(var i = 0; i < room.players.length; i++) {
        if(room.players[i].id === socket.id) {
          room.players.splice(i, 1);
        }
      }
      io.to(room.name).emit('enter lobby', room);
    }
    console.log('user disconnected', socket.id);
  });

//Creating game
  socket.on('create game', function(data) {
    var result = createGame(data);
    if(result !== false) {
      player = new Player(socket.id);
      lobbys[result].players.push(player);
      socket.emit('enter lobby', lobbys[result]);
      socket.join(data.name);
      room = lobbys[result];
    } else {
      socket.emit('create game failed', data);
    }
  });

  //Requesting lobbys
  socket.on('request lobbys', function() {
    socket.emit('recive lobbys', lobbys);
  });

  //Join Lobby
  socket.on('join lobby', function(data) {
    for(var i = 0; i < lobbys.length; i++) {
      if (lobbys[i].name === data.name && lobbys[i].maxPlayers > lobbys[i].players.length) {
        player = new Player(socket.id);
        lobbys[i].players.push(player);
        socket.join(data.name);
        room = lobbys[i];
        io.to(data.name).emit('enter lobby', lobbys[i]);
      }
    }
  });

//Start the game and remove from lobby
  socket.on('start', function() {
    io.to(room.name).emit('character selection', room);
    for(var i = 0; i < lobbys.length; i++) {
      if(lobbys[i] === room) {
        lobbys.splice(i, 1);
      }
    }
    room.board = new Board(30);
    if(room.players[0] === player) {
      socket.emit('choose character', {
        room,
        player
      });
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
  if(lobbys.length > 0) {
    for(var i = 0; i < lobbys.length; i++) {
      if(data.name === lobbys[i].name) {
        return false;
      }
    }
  }

  var newGame = new Game(data.name, data.type);
  lobbys.push(newGame);
  return lobbys.length-1;
}

/**
 ** Classes
 **/

 class Game {
   constructor(name, type) {
     this.name = name;
     this.type = type;
     this.board = {};
     this.players = [];
     this.dices = 1;
     this.maxPlayers = 2;
   }
 }

 class Player {
   constructor(id) {
     this.id = id;
     this.character = {};
     this.tile = 1;
   }
 }

class Board {
  constructor(tiles) {
    this.tiles = tiles;
  }
}

class Tile {
  constructor() {

  }
}
