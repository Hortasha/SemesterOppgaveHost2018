//Variables
//index
var gameName = document.getElementById("gameName");
var serverList = document.getElementById("serverList");
var body = document.getElementById("body");
var lobbyButtons = document.getElementsByClassName("lobby");
var tiles;

//game
var canvas;
var parent;
var context;


var position = 0;
var tile = 0;
var canEnd = false;
var player = "";

//Resize canvas if exist
window.onresize = function() {
  if(canvas !== undefined) {
    canvas.width = parent.offsetWidth-33;
    drawBoard(tiles);
  }
};

//Socket
var socket = io();

socket.on('refresh index', function(data) {
  serverList.innerHTML = "";
  for(var i = 0; i < data.lobbys.length; i++) {
    if(data.lobbys[i].players.length !== 10) {
      serverList.innerHTML += "<div class='[ col-md-4 ]'><button class='[ index__button--lobby ]' onclick='joinLobby(\"" + data.lobbys[i].name + "\")'><strong>Lobby Name:</strong> " + data.lobbys[i].name + "<br><strong>Players:</strong> " + data.lobbys[i].players.length + "</button></div>";
    }
  }
  if(data.lobbys.length < 1) {
    serverList.innerHTML = "<p class='[ index__error ]'>No games availeble, create a new game</p>";
  }
});

socket.on('refresh lobby', function(data) {
  tiles = data.tiles;
  body.innerHTML = "<h2 class='[ lobby__title ]'>Connected Players</2>";

  var playerConnections = document.createElement("div");
  playerConnections.setAttribute("class", "[ lobby__backgroundContainer ]");
  for(var i = 0; i < data.lobby.players.length; i++) {
    playerConnections.innerHTML += "<p><strong>Player " + (i+1) + ":</strong> Connected</p>";
  }
  body.appendChild(playerConnections);
  body.innerHTML += "<button class='[ lobby__button--start ]' onclick='characterScreen()'>Select Characters</button>";
});

socket.emit('refresh index');

socket.on('character selection screen', function(data) {
  if(socket.id === data.lobby.players[0].id) {
    body.innerHTML = "<h2 class='lobby__title' id='player'>Your Turn</h2>";
  } else {
    body.innerHTML = "<h2 class='lobby__title' id='player'>Player 1</h2>";
  }
  body.innerHTML += "<p>Choose one of the characters below</p>";
  var characterDiv = document.createElement("div");
  body.appendChild(characterDiv);
  characterDiv.setAttribute("class", "[ row ]");
  for(var i = 0; i < data.characters.length; i++) {
    characterDiv.innerHTML += "<div class='[ col-md-4 ]' id='" + i + "d'><button class='[ lobby__button--character ]' id='" + i + "' onclick='selectCharacter(\"" + i + "\")'><p><strong>Name: </strong>" + data.characters[i].name + "</p><p><strong>Piece: </strong><img src=\"" + data.characters[i].icon + "\" alt=\"" + data.characters[i].name + "\"></img></p><p><strong>Gender: </strong>" + data.characters[i].sex + "</p></button></div>";

    //Adding aliases
    var characterButton = document.getElementById(i);

    var aliases = document.createElement("p");
    characterButton.appendChild(aliases);
    aliases.innerHTML = "<strong>Aliases: </strong><br>";

    for(var j = 0; j < data.characters[i].aliases.length; j++) {
      if(j === 0) {
        aliases.innerHTML += data.characters[i].aliases[j];
      } else {
        aliases.innerHTML += ", " + data.characters[i].aliases[j];
      }
    }

  }
});

socket.on('next character select', function(data) {
  var heading = document.getElementById('player');
  if(data.player.id === socket.id) {
    heading.innerHTML = "Your Turn";
  } else {
    heading.innerHTML = "Player " + data.player.playerNum;
  }

  document.getElementById(data.taken.toString() + "d").remove();
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
  contentDiv1.innerHTML += "<div class='[ col-md-12 ][ game__background ]'><h3 class='[ game__underTitle ]'>Player Positions</h3><p id='playerPos'></p></div>";

  //Row 2
  var contentDiv2 = document.createElement("div");
  body.appendChild(contentDiv2);
  contentDiv2.setAttribute("class", "[ row ][ game__row ][ game__background ]");

  contentDiv2.innerHTML = "<div class='[ col-md-12 ]'><h3 class='[ game__underTitle ]'>Board</h3></div><div class='[ col-md-12 ]' id='canvasParent'><img src=\'" + data.lobby.players[0].character.icon + "\' id='playerIcon' width='50px' alt='player icon'><canvas id='canvas'></canvas></div>";


  //Row 3
  var contentDiv3 = document.createElement("div");
  body.appendChild(contentDiv3);
  contentDiv3.setAttribute("class", "[ row ][ game__rowEnd ]");
  contentDiv3.innerHTML = "<div class='[ col-6 ]'><div class='[ game__rollDisplay ]'><h2 class='[ game__rollValue ]' id='rollValue'><i class='fas fa-dice'></i></h2></div><button class='[ game__button--rollInactive ]' id='dice' onclick='rollDice()'>Roll</button></div><div class='[ col-6 ]'><button class='[ game__button--rollInactive game__button--align ]' id='endButton'>End Turn</button></div>";

  //get dom elements
  var playerPos = document.getElementById("playerPos");
  var playerIcon = document.getElementById("playerIcon");

  //Draw Canvas
  canvas = document.getElementById("canvas");
  parent = document.getElementById("canvasParent");
  context = canvas.getContext("2d");

  canvas.width = parent.offsetWidth-33;
  canvas.height = 50;
  drawBoard(data.tiles);

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

  if(data.lobby.players[0].id === socket.id) {
    var rollButton = document.getElementById("dice");
    rollButton.setAttribute("class", "[ game__button--roll ]");
  }
  var endButton = document.getElementById("endButton");
  endButton.addEventListener("click", function() {
    endTurn();
  });
  player = data.lobby.players[0];
});

socket.on('move player', function(data) {
  var dice = document.getElementById("rollValue");

  switch(data.dice) {
    case 1:
      dice.innerHTML = '<i class="fas fa-dice-one"></i>';
    break;

    case 2:
      dice.innerHTML = '<i class="fas fa-dice-two"></i>';
    break;

    case 3:
      dice.innerHTML = '<i class="fas fa-dice-three"></i>';
    break;

    case 4:
      dice.innerHTML = '<i class="fas fa-dice-four"></i>';
    break;

    case 5:
      dice.innerHTML = '<i class="fas fa-dice-five"></i>';
    break;

    case 6:
      dice.innerHTML = '<i class="fas fa-dice-six"></i>';
    break;

    default:
      dice.innerHTML = '<i class="<i class="fas fa-dice"></i>"';
  }
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

  //Animate movement to tile
  if(data.dice === 0) {
    tile = data.player.tile-1;
    drawBoard(data.tiles);
    setTimeout(function() {
      socket.emit('check tile', data);
    }, 1000);
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
  player = data.player;
  var heading = document.getElementById('player');
  var playerIcon = document.getElementById("playerIcon");
  var rollButton = document.getElementById("dice");

  //display next turn text
  displayNext(data.player);

  setTimeout(function() {
    //Change data
    if(data.player.id === socket.id) {
      heading.innerHTML = "Your Turn";
    } else {
      heading.innerHTML = data.player.character.name;
    }

    tile = data.player.tile-1;
    drawBoard(data.tiles);
    playerIcon.src = data.player.character.icon;
    if(data.player.id === socket.id) {
      rollButton.setAttribute("class", "[ game__button--roll ]");
    }
  }, 2000);
});

socket.on('roll again', function(data) {

    //variables
    var heading = document.getElementById('player');
    var rollButton = document.getElementById("dice");

    if(data.player.id === socket.id) {
      heading.innerHTML = "Your Turn";
    } else {
      heading.innerHTML = data.player.character.name;
    }

    tile = data.player.tile-1;
    drawBoard(data.tiles);
    if(data.player.id === socket.id) {
      rollButton.setAttribute("class", "[ game__button--roll ]");
    }
});

socket.on('next trigger', function(data) {

  if(data.player.id === socket.id) {
    var endButton = document.getElementById("endButton");
    endButton.setAttribute("class", "[ game__button--roll game__button--align ]");
    canEnd = true;
  }
});

socket.on('alert', function(data) {
  alert(data.message);
});

socket.on('winning', function(data) {
  if(data.player.id === socket.id) {
    body.innerHTML = "<h2 class='[ game__title ]'>You Won!</h2>";
  } else {
    body.innerHTML = '<h2 class="[ game__title ]">' + data.player.character.name + ' wins</h2>';
  }
  body.innerHTML += "<h3 class='[ game__normalTitle ]'>Background image from:<h3>"
  body.innerHTML += '<a style="background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px" href="https://unsplash.com/@jonnyauh?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge" target="_blank" rel="noopener noreferrer" title="Download free do whatever you want high-resolution photos from Jonathan Auh"><span style="display:inline-block;padding:2px 3px"><svg xmlns="http://www.w3.org/2000/svg" style="height:12px;width:auto;position:relative;vertical-align:middle;top:-1px;fill:white" viewBox="0 0 32 32"><title>unsplash-logo</title><path d="M20.8 18.1c0 2.7-2.2 4.8-4.8 4.8s-4.8-2.1-4.8-4.8c0-2.7 2.2-4.8 4.8-4.8 2.7.1 4.8 2.2 4.8 4.8zm11.2-7.4v14.9c0 2.3-1.9 4.3-4.3 4.3h-23.4c-2.4 0-4.3-1.9-4.3-4.3v-15c0-2.3 1.9-4.3 4.3-4.3h3.7l.8-2.3c.4-1.1 1.7-2 2.9-2h8.6c1.2 0 2.5.9 2.9 2l.8 2.4h3.7c2.4 0 4.3 1.9 4.3 4.3zm-8.6 7.5c0-4.1-3.3-7.5-7.5-7.5-4.1 0-7.5 3.4-7.5 7.5s3.3 7.5 7.5 7.5c4.2-.1 7.5-3.4 7.5-7.5z"></path></svg></span><span style="display:inline-block;padding:2px 3px">Jonathan Auh</span></a>';

  body.innerHTML += "<h3 class='[ game__normalTitle ]'>Font from:<h3>"
  body.innerHTML += '<a style="background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px" href="https://fontmeme.com/fonts/game-of-thrones-font/" target="_blank" rel="noopener noreferrer" title="game of thrones font replicated"><span style="display:inline-block;padding:2px 3px">Charlie Samways</span></a>';
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
  var rollButton = document.getElementById("dice");
  rollButton.setAttribute("class", "[ game__button--rollInactive ]");
  if (turn.innerHTML === "Your Turn") {
    var i = 0;
    turn.innerHTML = "Moving";
    function roll() {
      setTimeout(function() {
        if(i < 10) {
          var num = Math.floor(Math.random() * 6) + 1;

          switch(num) {
            case 1:
              dice.innerHTML = '<i class="fas fa-dice-one"></i>';
            break;

            case 2:
              dice.innerHTML = '<i class="fas fa-dice-two"></i>';
            break;

            case 3:
              dice.innerHTML = '<i class="fas fa-dice-three"></i>';
            break;

            case 4:
              dice.innerHTML = '<i class="fas fa-dice-four"></i>';
            break;

            case 5:
              dice.innerHTML = '<i class="fas fa-dice-five"></i>';
            break;

            case 6:
              dice.innerHTML = '<i class="fas fa-dice-six"></i>';
            break;

            default:
              dice.innerHTML = '<i class="<i class="fas fa-dice"></i>"';
          }
          roll();
        } else {
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

function endTurn() {
  var endButton = document.getElementById("endButton");

  endButton.setAttribute("class", "[ game__button--rollInactive game__button--align ]");
  if (canEnd) {
    socket.emit('next turn', {
      player: player
    });
  }
  canEnd = false;
}

function drawBoard(tiles) {
  if(canvas.getContext) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    //Stroke
    for(var i = tile-1; i < 30; i++) {
      context.beginPath();
      if(tiles[i] !== "") {
        context.fillStyle="#ff3232";
      } else {
        context.fillStyle="#000000";
      }
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
      if(tiles[i] !== "") {
        context.fillStyle="#ff3232";
      } else {
        context.fillStyle="#000000";
      }
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
