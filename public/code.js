//Variables
//Elements
var gameName = document.getElementById("gameName");
var serverList = document.getElementById("serverList");
var body = document.getElementById("body");
var lobbyButtons = document.getElementsByClassName("lobby");

//Socket
var socket = io();

socket.on('refresh index', function(data) {
  serverList.innerHTML = "";
  for(var i = 0; i < data.lobbys.length; i++) {
    serverList.innerHTML += "<button onclick='joinLobby(\"" + data.lobbys[i].name + "\")'>" + data.lobbys[i].name + "</button>";
  }
});

socket.on('refresh lobby', function(data) {
  body.innerHTML = "<h1>Connected Players</1>";
  for(var i = 0; i < data.lobby.players.length; i++) {
    body.innerHTML += "<p>Player " + (i+1) + ": " + data.lobby.players[i].id + "</p>";
  }
  body.innerHTML += "<button onclick='characterScreen()'>Play</button>";
});

socket.emit('refresh index');

socket.on('character selection screen', function(data) {
  if(socket.id === data.lobby.players[0].id) {
    body.innerHTML = "<h1 id='player'>Your Turn</h1>";
  } else {
    body.innerHTML = "<h1 id='player'>Player 1</h1>";
  }
  for(var i = 0; i < data.characters.length; i++) {
    body.innerHTML += "<button id='" + i + "' onclick='selectCharacter(\"" + i + "\")'>" + data.characters[i].name + "</button>";
  }
});

socket.on('next character select', function(data) {
  var heading = document.getElementById('player');
  if(data.player.id === socket.id) {
    heading.innerHTML = "Your Turn";
  } else {
    heading.innerHTML = "Player " + data.player.playerNum;
  }

  document.getElementById(data.taken.toString()).remove();
});

socket.on('start game', function(data) {
  if(socket.id === data.lobby.players[0].id) {
    body.innerHTML = "<h1 id='player'>Your Turn</h1>";
  } else {
    body.innerHTML = "<h1 id='player'>Player 1</h1>";
  }
  body.innerHTML += "<button id='dice' onclick='rollDice()'>Roll</button>";
});

socket.on('move player', function(data) {
  console.log(data.player);
  //Animate movement to tile
  if(data.player.id === socket.id) {
    console.log('You moved to position ' + data.player.tile);
  } else {
    console.log('Player ' + data.player.playerNum + ': ' + data.player.character.name + ' moved to position ' + data.player.tile);
  }
  socket.emit('check tile', data);
});

socket.on('next turn', function(data) {
  var heading = document.getElementById('player');
  if(data.player.id === socket.id) {
    heading.innerHTML = "Your Turn";
  } else {
    for(var i = 0; i < data.lobby.players.length; i++) {
      if(data.lobby.players[i].id === socket.id) {
        heading.innerHTML = "Player " + data.lobby.players[i].playerNum;
      }
    }
  }
});

socket.on('winning', function(data) {
  if(data.player.id === socket.id) {
    body.innerHTML = "<h1>You Won!</h1>";
  } else {
    body.innerHTML = '<h1>Player ' + data.player.playerNum + ': ' + data.player.character.name + ' wins</h1>';
  }
});

function joinLobby(lobbyName) {
  socket.emit('join lobby', {
    lobbyName: lobbyName
  });
}

function createLobby() {
  socket.emit('create lobby', {
    lobbyName: gameName.value
  });
  socket.emit('refresh index');
}

function characterScreen() {
  socket.emit('character selection screen');
}

function selectCharacter(character) {
  var turn = document.getElementById("player");
  if (turn.innerHTML === "Your Turn") {
    socket.emit('select character', {
      characterId: character,
      playerId: socket.id
    });
  }
}

function rollDice() {
  var turn = document.getElementById("player");
  if (turn.innerHTML === "Your Turn") {
    turn.innerHTML = "Moving";
    socket.emit('roll', {
      playerId: socket.id
    });
  }
}
