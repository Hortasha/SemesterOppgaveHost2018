//Variables
//index
var gameName = document.getElementById("gameName");
var serverList = document.getElementById("serverList");
var body = document.getElementById("body");
var lobbyButtons = document.getElementsByClassName("lobby");


//game
var canvas;
var parent;
var context;


var position = 0;
var tile = 0;

//Resize canvas if exist
window.onresize = function() {
  if(canvas !== undefined) {
    canvas.width = parent.offsetWidth-33;
    drawBoard();
  }
};

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
  body.innerHTML = "";

  //Row 1
  var contentDiv1 = document.createElement("div");
  body.appendChild(contentDiv1);
  contentDiv1.setAttribute("class", "[ row ][ game__row ]");

  if(socket.id === data.lobby.players[0].id) {
    contentDiv1.innerHTML = "<div class='[ col-md-12 ]'><h2 class='[ game__title ]' id='player'>Your Turn</h2></div>";
  } else {
    contentDiv1.innerHTML = "<div class='[ col-md-12 ]'><h2 class='[ game__title ]' id='player'>" + data.lobby.players[0].character.name + "</h2></div>";
  }
  contentDiv1.innerHTML += "<div class='[ col-md-12 ][ game__background ]'><h3 class='[ game__underTitle ]'>Player positions</h3><p id='playerPos'></p></div>";

  //Row 2
  var contentDiv2 = document.createElement("div");
  body.appendChild(contentDiv2);
  contentDiv2.setAttribute("class", "[ row ][ game__row ][ game__background ]");

  contentDiv2.innerHTML = "<div class='[ col-md-12 ]'><h3 class='[ game__underTitle ]'>Board</h3></div><div class='[ col-md-12 ]' id='canvasParent'><img src=\'" + data.lobby.players[0].character.icon + "\' id='playerIcon' width='50px' alt='player icon'><canvas id='canvas'></canvas></div>";


  //Row 3
  var contentDiv3 = document.createElement("div");
  body.appendChild(contentDiv3);
  contentDiv3.setAttribute("class", "[ row ][ game__rowEnd ]");
  contentDiv3.innerHTML = "<div class='[ col-md-12 ]'><div class='[ game__rollDisplay ]'><h2 id='rollValue'>0</h2></div><button class='[ game__button--roll ]' id='dice' onclick='rollDice()'>Roll</button></div>";

  //get dom elements
  var playerPos = document.getElementById("playerPos");
  var playerIcon = document.getElementById("playerIcon");

  //Draw Canvas
  canvas = document.getElementById("canvas");
  parent = document.getElementById("canvasParent");
  context = canvas.getContext("2d");

  canvas.width = parent.offsetWidth-33;
  canvas.height = 50;
  drawBoard();

  //Player 1 setup

  var sortedPlayers = data.lobby.players;
  sortedPlayers.sort(function(a, b) {
    return b.tile - a.tile;
  });

  playerPos.innerHTML = "";
  for(var i = 0; i < sortedPlayers.length; i++) {
    if(sortedPlayers[i].id === socket.id) {
      playerPos.innerHTML += "<strong>You:</strong> Tile " + sortedPlayers[i].tile + " ";
    } else {
      playerPos.innerHTML += "<strong>" + sortedPlayers[i].character.name + ":</strong> Tile " + sortedPlayers[i].tile + " ";
    }
  }

});

socket.on('move player', function(data) {
  var dice = document.getElementById("rollValue");
  dice.innerHTML = data.dice;
  var sortedPlayers = data.lobby.players;
  sortedPlayers.sort(function(a, b) {
    return b.tile - a.tile;
  });

  playerPos.innerHTML = "";
  for(var i = 0; i < sortedPlayers.length; i++) {
    if(sortedPlayers[i].id === socket.id) {
      playerPos.innerHTML += "<strong>You:</strong> Tile " + sortedPlayers[i].tile + " ";
    } else {
      playerPos.innerHTML += "<strong>" + sortedPlayers[i].character.name + ":</strong> Tile " + sortedPlayers[i].tile + " ";
    }
  }

  if(data.player.id === socket.id) {
    console.log('You moved to position ' + data.player.tile);
  } else {
    console.log('Player ' + data.player.character.name + ': ' + data.player.character.name + ' moved to position ' + data.player.tile);
  }


  //Animate movement to tile
  if(data.dice === 0) {
    tile = data.player.tile-1;
    drawBoard();
    socket.emit('check tile', data);
  } else {
    var i = 0;
    function animateCalls() {
      setTimeout(function() {
        if(i < data.dice) {
          animateBoard();
          animateCalls();
        } else {
          socket.emit('check tile', data);
        }
        i++;
        tile++;
      }, 600);
    }
    animateCalls();
  }
});

socket.on('next turn', function(data) {
  //variables
  var heading = document.getElementById('player');
  var playerIcon = document.getElementById("playerIcon");

  //display next turn text
  displayNext(data.player);

  setTimeout(function() {
    //Change data
    if(data.player.id === socket.id) {
      heading.innerHTML = "Your Turn";
    } else {
      for(var i = 0; i < data.lobby.players.length; i++) {
        if(data.lobby.players[i].id === socket.id) {
          heading.innerHTML = data.lobby.players[i].character.name;
        }
      }
    }

    tile = data.player.tile-1;
    drawBoard();
    playerIcon.src = data.player.character.icon;
  }, 2000);
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
  var dice = document.getElementById("rollValue");

  if (turn.innerHTML === "Your Turn") {
    var i = 0;
    function roll() {
      setTimeout(function() {
        if(i < 10) {
          dice.innerHTML = Math.floor(Math.random() * 6) + 1;
          roll();
        } else {
          turn.innerHTML = "Moving";
          socket.emit('roll', {
            playerId: socket.id
          });
        }
        i++;
      }, 100);
    }
    roll();
  }
}

function drawBoard() {
  if(canvas.getContext) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    //Stroke
    for(var i = tile-1; i < 30; i++) {
      context.beginPath();
      context.rect((i-tile)*50, 0, 50, 50);
      context.closePath();
      context.stroke();
      context.font = "20px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(i+1, (i-tile)*50+25, 25);
    }

  } else {
    alert("Youre browser does not support canvas");
  }
}

function animateBoard() {
  if(canvas.getContext) {

    var animation = requestAnimationFrame(animateBoard);

    context.clearRect(0, 0, canvas.width, canvas.height);
    position -= 5;

    //Stroke
    for(var i = tile-1; i < 30; i++) {
      context.beginPath();
      context.rect((i-tile+1)*50+position, 0, 50, 50);
      context.closePath();
      context.stroke();
      context.font = "20px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(i+1, (i-tile+1)*50+25+position, 25);
    }

    if(position === -50) {
      cancelAnimationFrame(animation);
      position = 0;
    }

  } else {
    alert("Youre browser does not support canvas");
  }
}

function displayNext(player) {
  if(canvas.getContext) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "20px Thrones";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(player.character.name, canvas.width/2, 25);
  } else {
    alert("Youre browser does not support canvas");
  }
}
