require('isomorphic-fetch');

//Setup
var port = 3000;
var express = require('express');
var socket = require('socket.io');
var app = express();
var server = app.listen(port, function() {
  console.log("listening to port " + port);
});
var io = socket(server);

//static file
app.use(express.static('public'));

//Game Variables
var lobbys = [];
var characters = [];
var tiles = [];

//Client connection
io.on('connection', function(socket) {
  console.log("connected " + socket.id);
  //Connection data
  var player = new Player(socket.id);
  var lobby = "";

//Client disconnects
  socket.on('disconnect', function(){
    console.log("disconnected " + socket.id);

    //If player is part of a game, remove player from game
    if(lobby !== "") {
      for(var i = 0; i < lobby.players.length; i++) {
        if(lobby.players[i].id === socket.id) {
          lobby.players.splice(i, 1);
        }
      }

      //If game is empty remove the game from lobbys.
      if(lobby !== "") {
        if(lobby.players.length < 1) {
          for(var i = 0; i < lobbys.length; i++) {
            if(lobbys[i] === lobby) {
              lobbys.splice(i, 1);
            }
          }
        }
      }

      //Refresh game lobby after a disconnect
      io.to(lobby.name).emit('refresh lobby', {
        lobby: lobby,
        tiles: tiles
      });

      //Refresh lobby information for all clients on index.
      io.emit('refresh index', {
        lobbys: lobbys
      });
    }
  });

//Trigger on refresh index request
  socket.on('refresh index', function() {

    //Refresh lobby information for all clients on index.
    io.emit('refresh index', {
      lobbys: lobbys
    });
  });

//Trigger on join lobby
  socket.on('join lobby', function(data) {

    //Locate correct lobby and assign values correctly.
    for(var i = 0; i < lobbys.length; i++) {
      if(lobbys[i].name === data.lobbyName) {
        lobby = lobbys[i];
        lobby.players.push(player);
        player.playerNum = lobby.players.length;

        //socket.io - player join room assigned to the game.
        socket.join(data.lobbyName);

        //Refresh game lobby for all clients connected to the game.
        io.to(lobby.name).emit('refresh lobby', {
          lobby: lobby,
          tiles: tiles
        });

        //refresh index for all clients on index page.
        io.emit('refresh index', {
          lobbys: lobbys
        });
      }
    }
  });

//Trigger to create lobby
  socket.on('create lobby', function(data) {

    //Check if lobby name is valid
    var valid = true;
    if(data.lobbyName === "") {
      valid = false;
    }

    for(var i = 0; i < lobbys.length; i++) {
      if(lobbys[i].name === data.lobbyName) {
        valid = false;
      }
    }

    //If still valid create room and assign values
    if(valid === true) {
      lobby = new Game(data.lobbyName);
      lobby.players.push(player);
      lobbys.push(lobby);
      socket.join(data.lobbyName);
      player.playerNum = lobby.players.length;

      //Refresh game lobby for all clients in game.
      io.to(lobby.name).emit('refresh lobby', {
        lobby: lobby,
        tiles: tiles
      });
    }
  });

//Trigger on character selection screen
  socket.on('character selection screen', function() {

    //Remove game from availeble lobbys to join.
    if(lobby !== "") {
      for(var i = 0; i < lobbys.length; i++) {
        if(lobbys[i] === lobby) {
          lobbys.splice(i, 1);
        }
      }
    }

    //Refresh lobbys for all clients on index page.
    io.emit('refresh index', {
      lobbys: lobbys
    });

    //Send all clients connected to current game to character selection screen
    io.to(lobby.name).emit('character selection screen', {
      lobby: lobby,
      characters: characters
    });
  });

//Trigger on select character
  socket.on('select character', function(data) {

    //Assign character to player
    player.character = characters[data.characterId];

    //Locate next player
    var next = "";
    for(var i = 0; i < lobby.players.length; i++) {
      if(lobby.players[i].id === data.playerId) {
        next = lobby.players[i+1];
      }
    }

    //If all players have selected a character start the game for all clients
    if(next == null) {
      io.to(lobby.name).emit('start game', {
        lobby: lobby,
        tiles: tiles
      });
    } else {

    //Trigger next player to be availeble to selext character
      io.to(lobby.name).emit('next character select', {
        taken: data.characterId,
        player: next
      });
    }
  });


// Trigger on roll
  socket.on('roll', function(data) {

    //Roll the dice and move client
    var rollAmount = Math.floor(Math.random() * 6) + 1;
    player.tile += rollAmount;
    if(rollAmount === 6) {
      player.reroll = true;
    }

    //Trigger client to execute movement on board
    io.to(lobby.name).emit('move player', {
      lobby: lobby,
      player: player,
      dice: rollAmount,
      tiles: tiles
    });
  });


// trigger on check tile
  socket.on('check tile', function(data) {

    //Check win condition
    if(data.player.tile >= 30) {
      io.to(lobby.name).emit('winning', {
        player: data.player
      });

    //Check if client landed on trap and what the trap does
    } else if(tiles[data.player.tile-1] !== "") {
      if(data.player.id === socket.id) {
        if(tiles[data.player.tile-1].direction === "-") {
          if(socket.id === data.player.id) {
            player.tile -= tiles[data.player.tile-1].number;
          }
        }
        if(tiles[data.player.tile-1].direction === "=") {
          if(socket.id === data.player.id) {
            player.tile = tiles[player.tile-1].number;
          }
        }

        //Alert client that landed on trap
        socket.emit('alert', {
          message: tiles[data.player.tile-1].message,
          player: data.player
        });
      }

      //Move the client
      for(var i = 0; i < lobby.players.length; i++) {
        if (lobby.players[i].id === data.player.id) {
          socket.emit('move player', {
            lobby: lobby,
            player: lobby.players[i],
            dice: 0,
            tiles: tiles
          });
        }
      }

    //If client previosuly rolled 6 provide reroll
    } else if(data.player.reroll === true) {
      if(data.player.id === socket.id) {
        player.reroll = false;
      }
      socket.emit('roll again', {
        lobby: lobby,
        player: data.player,
        tiles: tiles
      });

    //If none of the conditions above apply client get option to end turn.
    } else {
      socket.emit('next trigger', {
        player: data.player
      });
    }
  });

// trigger on next turn
  socket.on('next turn', function(data){
    if(tiles[data.player.tile-1] === "") {

      //Locate next player
      var next = "";
      if(lobby.players[data.player.playerNum] !== undefined) {
        next = lobby.players[data.player.playerNum];
      } else {
        next = lobby.players[0];
      }

      //Tell all clients what client get next turn
      io.to(lobby.name).emit('next turn', {
        lobby: lobby,
        player: next,
        tiles: tiles
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
   constructor(name, icon, sex, aliases) {
     this.name = name;
     this.icon = icon;
     this.sex = sex;
     this.aliases = aliases;

   }
 }

 class Tile {
   /*
   * Number specifies amount of tiles
   * Direction specifies - or =. Moving back or moving towards
   * Message specifies what message to display for the player when landing on tile.
   */
   constructor(number, direction, message) {
     this.number = number;
     this.direction = direction;
     this.message = message
   }
 }

//Character names
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

//Execute API calls for all characters
 for(let i = 0; i < characterNames.length; i++) {
   getAPI(characterNames[i].first, characterNames[i].last)
     .then(function (result) {
       characters.push(new Character(result[0].name, characterNames[i].first + ".png", result[0].gender, result[0].aliases));
     });
 }

//Push all tiles on the board to an array
tiles.push("");                   //1
tiles.push("");                   //2
tiles.push("");                   //3
tiles.push("");                   //4
tiles.push(new Tile(2, "-", "You fell, move back 2 steps."));     //5
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
tiles.push(new Tile(3, "-", "You were hold up by bad weather, move back 3 steps."));     //17
tiles.push("");                   //18
tiles.push("");                   //19
tiles.push(new Tile(1, "=", "The white walkers got you. Move back to start."));     //20
tiles.push("");                   //21
tiles.push(new Tile(4, "-", "You lost in a duel, move back 4 steps."));     //22
tiles.push("");                   //23
tiles.push("");                   //24
tiles.push("");                   //25
tiles.push(new Tile(1, "=", "You got attacked by a big dragon. Move back to start."));     //26
tiles.push("");                   //27
tiles.push("");                   //28
tiles.push("");                   //29
tiles.push("");                   //30

//API call function for finding character data.
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
