require('isomorphic-fetch');

//Setup
var port = 3000;
var express = require('express');
var socket = require('socket.io');
var app = express();
var server = app.listen(port, function() {
  console.log('listening on *:' + port);
})
var io = socket(server);

//static file
app.use(express.static('public'));

//Game Variables
var lobbys = [];
var characters = [];
var tiles = [];

//Client request connection
io.on('connection', function(socket) {

//Connection data
  var player = new Player(socket.id);
  var lobby = "";

  console.log('connected', socket.id);

//Client disconnects
  socket.on('disconnect', function(){

//If player is part of a lobby, remove player from lobby
    if(lobby !== "") {
      for(var i = 0; i < lobby.players.length; i++) {
        if(lobby.players[i].id === socket.id) {
          lobby.players.splice(i, 1);
        }
      }

//Refresh player lobby after a disconnect
      io.to(lobby.name).emit('refresh lobby', {
        lobby: lobby
      });
    }
    console.log('user disconnected', socket.id);
  });


//Client request to get lobbys to join
  socket.on('refresh index', function() {
    io.emit('refresh index', {
      lobbys: lobbys
    });
  });

  /**
   ** Client requesting to join lobby
   ** Looping through all lobbys and locate the lobby that is clicked on
   ** Save the lobby as variable, push player to that lobby
   ** Join the lobby room to easier broadcast to that room.
   ** Assign player player number
   ** Refresh lobby for everyone allready in the lobby
   **/

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
        io.emit('refresh index', {
          lobbys: lobbys
        });
      }
    }
  });



  /**
   ** Client requesting to create a new lobby
   ** Create a new game for the lobby and push it to a variable.
   ** Join the lobby room to easier broadcast to that room.
   ** Assign player player number
   ** Refresh lobby for everyone allready in the lobby
   **/

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

  /**
   ** Client requesting characters to put in character selection screen
   ** Refresh index for everyine looking for lobby.
   ** This lobby should no longer be an option to join.
   ** Provides all clients with characters to display
   **/

  socket.on('character selection screen', function() {
    for(var i = 0; i < lobbys.length; i++) {
      if(lobbys[i] === lobby) {
        lobbys.splice(i, 1);
      }
    }

    io.emit('refresh index', {
      lobbys: lobbys
    });

    io.to(lobby.name).emit('character selection screen', {
      lobby: lobby,
      characters: characters
    });
  });

  /**
   ** Client have chosen a character
   ** Assign character to player
   ** Calulate what player that can choose next
   ** If everyone have chosen a character start the game
   ** If not provide all clients with what character have been chosen
   ** and what client that can choose a character next
   **/

  socket.on('select character', function(data) {
    player.character = characters[data.characterId];

    var next = "";
    for(var i = 0; i < lobby.players.length; i++) {
      if(lobby.players[i].id === data.playerId) {
        next = lobby.players[i+1];
      }
    }
    if(next == null) {
      io.to(lobby.name).emit('start game', {
        lobby: lobby
      });
    } else {
      io.to(lobby.name).emit('next character select', {
        taken: data.characterId,
        player: next
      });
    }
  });

  /**
   ** Client roll the dice
   ** Calculates the roll and add the roll the the player
   ** Inform all clients where player moves to.
   **/
  socket.on('roll', function(data) {
    var rollAmount = Math.floor(Math.random() * 6) + 1;
    player.tile += rollAmount;
    if(rollAmount === 6) {
      player.reroll = true;
    }

    io.to(lobby.name).emit('move player', {
      lobby: lobby,
      player: player,
      dice: rollAmount
    });
  });


  /**
   ** Client land on a tile
   ** Display win screen for all clients of a player have won.
   ** If tile does not do anything roll again for whoever is next
   ** If tile does move the player further provide all clients with the new movement
   **/
  socket.on('check tile', function(data) {
    //Win condision
    if(data.player.tile >= 30) {
      io.to(lobby.name).emit('winning', {
        player: data.player
      });
    } else if(tiles[data.player.tile-1] === "") {

      //Next player to roll next turn
      var next = "";
      next = lobby.players[data.player.playerNum];

      if(next == null) {
        next = lobby.players[0];
      }

      //Check Reroll
      if(data.player.reroll === true) {
        if(data.player.id === player.id) {
          player.reroll = false;
        }
        next = lobby.players[data.player.playerNum-1];
      }

      socket.emit('next turn', {
        lobby: lobby,
        player: next
      });
    } else {

      //If tiles does anythig specific figure out and execute
      if(tiles[data.player.tile-1].direction === "-") {
        if(player.id === data.player.id) {
          player.tile -= tiles[player.tile-1].number;
        }
      }
      if(tiles[data.player.tile-1].direction === "+") {
        if(player.id === data.player.id) {
          player.tile += tiles[player.tile-1].number;
        }
      }
      if(tiles[data.player.tile-1].direction === "=") {
        if(player.id === data.player.id) {
          player.tile = tiles[player.tile-1].number;
        }
      }

      var next = "";
      for(var i = 0; i < lobby.players.length; i++) {
        if(lobby.players[i].id === data.player.id) {
          next = lobby.players[i];
        }
      }

      socket.emit('move player', {
        lobby: lobby,
        player: next,
        dice: 0
      });
    }
  });
});

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
     this.lobby = "";
     this.reroll = false;
   }
 }

 class Character {
   constructor(name) {
     this.name = name;
   }
 }

 class Tile {
   /*
   * Number specifies what tile or how many tiles
   * Direction specifies if going back amount of tiles or forward. If neighter is specfied player will be moved to tile of that number.
   */
   constructor(number, direction) {
     this.number = number;
     this.direction = direction;
   }
 }

/**
 ** Get character data from API
 **/

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
     });
 }

 /**
  ** Tile info
  **/

tiles.push("");                   //1
tiles.push("");                   //2
tiles.push("");                   //3
tiles.push("");                   //4
tiles.push(new Tile(2, "-"));     //5
tiles.push("");                   //6
tiles.push("");                   //7
tiles.push("");                   //8
tiles.push("");                   //9
tiles.push("");                   //10
tiles.push("");                   //11
tiles.push("");                   //12
tiles.push("");                   //13
tiles.push("");                   //14
tiles.push("");                   //15
tiles.push("");                   //16
tiles.push(new Tile(3, "-"));     //17
tiles.push("");                   //18
tiles.push("");                   //19
tiles.push(new Tile(1, "="));     //20
tiles.push("");                   //21
tiles.push(new Tile(4, "-"));     //22
tiles.push("");                   //23
tiles.push("");                   //24
tiles.push("");                   //25
tiles.push(new Tile(1, "="));     //26
tiles.push("");                   //27
tiles.push("");                   //28
tiles.push("");                   //29
tiles.push("");                   //30

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
