require('isomorphic-fetch');

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
var players = [];
var characters = [];

//Connected
io.on('connection', function(socket) {

//Connection data
  var player = new Player(socket.id);
  var lobby = "";

  players.push(player);
  console.log('connected', socket.id);

//Disconnected
  socket.on('disconnect', function(){
    if(lobby !== "") {
      for(var i = 0; i < lobby.players.length; i++) {
        if(lobby.players[i].id === socket.id) {
          lobby.players.splice(i, 1);
        }
      }
      io.to(lobby.name).emit('refresh lobby', {
        lobby: lobby
      });
    }

    for(var i = 0; i < players.length; i++) {
      if(players[i].id === socket.id) {
        players.splice(i, 1);
      }
    }
    console.log('user disconnected', socket.id);
  });

  // Above is only connect and disconnect

  socket.on('refresh index', function() {
    io.emit('refresh index', {
      lobbys: lobbys
    });
  });

  socket.on('join lobby', function(data) {
    for(var i = 0; i < lobbys.length; i++) {
      if(lobbys[i].name === data.lobbyName) {
        lobby = lobbys[i];
        lobby.players.push(player);
        socket.join(data.lobbyName);
        player.playerNum = lobby.players.length;
        io.to(lobby.name).emit('refresh lobby', {
          lobby: lobby
        });
      }
    }
  });

  socket.on('create lobby', function(data) {
    lobby = new Game(data.lobbyName);
    lobby.players.push(player);
    lobbys.push(lobby);
    socket.join(data.lobbyName);
    player.playerNum = lobby.players.length;
    io.to(lobby.name).emit('refresh lobby', {
      lobby: lobby
    });
  });

  socket.on('character selection screen', function() {
    var characterNames = [{first: "Daenerys", last: "Targaryen"},
      {first: "Jon", last: "Snow"},
      {first: "Tyrion", last: "Lannister"},
      {first: "Sansa", last: "Stark"},
      {first: "Cersei", last: "Lannister"},
      {first: "Joffrey", last: "Baratheon"},
      {first: "Eddard", last: "Stark"},
      {first: "Arya", last: "Stark"},
      {first: "Tywin", last: "Lannister"},
      {first: "Jaime", last: "Lannister"}];
    for(var i = 0; i < characterNames.length; i++) {
      getAPI(characterNames[i].first, characterNames[i].last)
        .then(function (result) {
          characters.push(new Character(result[0].name));
          console.log(characters);
        });
    }

    io.to(lobby.name).emit('character selection screen', {
      lobby: lobby,
      characters: character
    });
  });
});

/**
 ** Function
 **/

 function getAPI(firstName, lastName) {
  return new Promise(
  resolve => {
    fetch('https://anapioficeandfire.com/api/characters?name=' + firstName + '+' + lastName)
      .then(function(response) {
        return response.json();
      })
      .then(function(myJson) {
        resolve(myJson);
      });
  },

  reject => {
    reject("Not able to fetch API");
  });


}

/**
 ** Classes
 **/

 class Game {
   constructor(name) {
     this.name = name;
     this.players = [];
     this.tiles = 30;
   }
 }

 class Player {
   constructor(id) {
     this.id = id;
     this.playerNum;
     this.character = {};
     this.tile = 1;
   }
 }

 class Character {
   constructor(name) {
     this.name = name;
     this.selected = false;
     this.player;
   }
 }
