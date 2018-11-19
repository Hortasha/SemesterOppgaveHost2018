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
    serverList.innerHTML += "<div class='[ col-md-4 ]'><button class='[ index__button--lobby ]' onclick='joinLobby(\"" + data.lobbys[i].name + "\")'><strong>Lobby Name:</strong> " + data.lobbys[i].name + "<br><strong>Players:</strong> " + data.lobbys[i].players.length + "</button></div>";
  }
});

socket.on('refresh lobby', function(data) {
  body.innerHTML = "<h2 class='[ lobby__title ]'>Connected Players</2>";
  for(var i = 0; i < data.lobby.players.length; i++) {
    body.innerHTML += "<p><strong>Player " + (i+1) + ":</strong> " + data.lobby.players[i].id + "</p>";
  }
  body.innerHTML += "<button class='[ lobby__button--start ]' onclick='characterScreen()'>Play</button>";
});

socket.emit('refresh index');

socket.on('character selection screen', function(data) {
  if(socket.id === data.lobby.players[0].id) {
    body.innerHTML = "<h2 class='lobby__title' id='player'>Your Turn</h2>";
  } else {
    body.innerHTML = "<h2 class='lobby__title' id='player'>Player 1</h2>";
  }
  var characterDiv = document.createElement("div");
  body.appendChild(characterDiv);
  characterDiv.setAttribute("class", "[ row ]");
  for(var i = 0; i < data.characters.length; i++) {
    characterDiv.innerHTML += "<div class='[ col-md-4 ]'><button class='[ lobby__button--character ]' id='" + i + "' onclick='selectCharacter(\"" + i + "\")'>" + data.characters[i].name + "</button></div>";
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
    body.innerHTML = "<h2 class='[ game__title ]' id='player'>Your Turn</h2>";
  } else {
    body.innerHTML = "<h2 class='[ game__title ]' id='player'>Player 1</h2>";
  }
  body.innerHTML += "<button class='[ game__button--roll ]' id='dice' onclick='rollDice()'>Roll</button>";
});

socket.on('move player', function(data) {
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
    body.innerHTML = "<h2 class='[ game__title ]'>You Won!</h2>";
  } else {
    body.innerHTML = '<h2 class="[ game__title ]">Player ' + data.player.playerNum + ': ' + data.player.character.name + ' wins</h2>';
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
