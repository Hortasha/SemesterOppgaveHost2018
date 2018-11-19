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

  body.innerHTML += '<a style="background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px" href="https://unsplash.com/@jonnyauh?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge" target="_blank" rel="noopener noreferrer" title="Download free do whatever you want high-resolution photos from Jonathan Auh"><span style="display:inline-block;padding:2px 3px"><svg xmlns="http://www.w3.org/2000/svg" style="height:12px;width:auto;position:relative;vertical-align:middle;top:-1px;fill:white" viewBox="0 0 32 32"><title>unsplash-logo</title><path d="M20.8 18.1c0 2.7-2.2 4.8-4.8 4.8s-4.8-2.1-4.8-4.8c0-2.7 2.2-4.8 4.8-4.8 2.7.1 4.8 2.2 4.8 4.8zm11.2-7.4v14.9c0 2.3-1.9 4.3-4.3 4.3h-23.4c-2.4 0-4.3-1.9-4.3-4.3v-15c0-2.3 1.9-4.3 4.3-4.3h3.7l.8-2.3c.4-1.1 1.7-2 2.9-2h8.6c1.2 0 2.5.9 2.9 2l.8 2.4h3.7c2.4 0 4.3 1.9 4.3 4.3zm-8.6 7.5c0-4.1-3.3-7.5-7.5-7.5-4.1 0-7.5 3.4-7.5 7.5s3.3 7.5 7.5 7.5c4.2-.1 7.5-3.4 7.5-7.5z"></path></svg></span><span style="display:inline-block;padding:2px 3px">Jonathan Auh</span></a>';
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
