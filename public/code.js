//Variables

//Elements
var gameName = document.getElementById("gameName");
var serverList = document.getElementById("serverList");
var body = document.getElementById("body");
var lobbyButtons = document.getElementsByClassName("lobby");

//Canvas
var canvas;
var parent;
var context;
var tiles;
var position = 0;
var tile = 0;

//Other
var canEnd = false;
var player = "";

//Socket
var socket = io();

//Resize canvas when resizing window
window.onresize = function() {
  if(canvas !== undefined) {
    canvas.width = parent.offsetWidth-33;
    drawBoard(tiles);
  }
};

//Get availeble lobbys first time loading page
socket.emit('refresh index');

//Trigger on refresh index
socket.on('refresh index', function(data) {

  //Populate availeble lobbys on index page.
  serverList.innerHTML = "";
  for(var i = 0; i < data.lobbys.length; i++) {
    if(data.lobbys[i].players.length !== 10) {
      serverList.innerHTML += "<div class='[ col-md-4 ]'><button class='[ index__button--lobby ]' onclick='joinLobby(\"" + data.lobbys[i].name + "\")'><strong>Lobby Name:</strong> " + data.lobbys[i].name + "<br><strong>Players:</strong> " + data.lobbys[i].players.length + "</button></div>";
    }
  }
  //Message of no lobbys are availeble
  if(data.lobbys.length < 1) {
    serverList.innerHTML = "<p class='[ index__error ]'>No games availeble, create a new game</p>";
  }
});


//Trigger on refresh lobby
socket.on('refresh lobby', function(data) {
  //Data for canvas later
  tiles = data.tiles;

  //Generate game lobby
  body.innerHTML = "<h2 class='[ lobby__title ]'>Connected Players</2>";

  var playerConnections = document.createElement("div");
  playerConnections.setAttribute("class", "[ lobby__backgroundContainer ]");
  for(var i = 0; i < data.lobby.players.length; i++) {
    playerConnections.innerHTML += "<p><strong>Player " + (i+1) + ":</strong> Connected</p>";
  }
  body.appendChild(playerConnections);
  body.innerHTML += "<button class='[ lobby__button--start ]' onclick='characterScreen()'>Select Characters</button>";
});

//Trigger on character selection Screen
socket.on('character selection screen', function(data) {
  //Populate page with characters to select
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

//Trigger on next character select
socket.on('next character select', function(data) {
  //Change to next players turn
  var heading = document.getElementById('player');
  if(data.player.id === socket.id) {
    heading.innerHTML = "Your Turn";
  } else {
    heading.innerHTML = "Player " + data.player.playerNum;
  }

  //Remove previously selected character
  document.getElementById(data.taken.toString() + "d").remove();
});


//Trigger on start game
socket.on('start game', function(data) {
  //populate game page
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

  //Setup for player 1

  //Sort Score
  var sortedPlayers = data.lobby.players;
  sortedPlayers.sort(function(a, b) {
    return b.tile - a.tile;
  });

  //Refresh Score in html
  playerPos.innerHTML = "";
  for(var i = 0; i < sortedPlayers.length; i++) {
    if(sortedPlayers[i].id === socket.id) {
      playerPos.innerHTML += "<strong>You:</strong> Tile " + sortedPlayers[i].tile + " ";
    } else {
      playerPos.innerHTML += "<strong>" + sortedPlayers[i].character.name + ":</strong> Tile " + sortedPlayers[i].tile + " ";
    }
  }

  //Assign color to clickable roll button for player 1
  if(data.lobby.players[0].id === socket.id) {
    var rollButton = document.getElementById("dice");
    rollButton.setAttribute("class", "[ game__button--roll ]");
  }

  //Add functinality to end turn button
  var endButton = document.getElementById("endButton");
  endButton.addEventListener("click", function() {
    endTurn();
  });

  //current player
  player = data.lobby.players[0];
});

//Trigger on move player
socket.on('move player', function(data) {

  //Display what player rolled
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
      dice.innerHTML = '<i class="fas fa-dice"></i>';
  }

  //score sort
  var sortedPlayers = data.lobby.players;
  sortedPlayers.sort(function(a, b) {
    return b.tile - a.tile;
  });

  //refresh score in html
  playerPos.innerHTML = "";
  for(var i = 0; i < sortedPlayers.length; i++) {
    if(sortedPlayers[i].id === socket.id) {
      playerPos.innerHTML += "<strong>You:</strong> Tile " + sortedPlayers[i].tile + " ";
    } else {
      playerPos.innerHTML += "<strong>" + sortedPlayers[i].character.name + ":</strong> Tile " + sortedPlayers[i].tile + " ";
    }
  }

  //Move player back depending on trap
  if(data.dice === 0) {
    tile = data.player.tile-1;
    drawBoard(data.tiles);
    setTimeout(function() {
      //Send trigger to server to check tile
      socket.emit('check tile', data);
    }, 1000);
  } else {
    //Animate player forward depending on roll amount
    var i = 0;
    function animateCalls() {
      setTimeout(function() {
        if(i < data.dice) {
          animateBoard();
          animateCalls();
        } else {
          //Send trigger to server to check tile
          socket.emit('check tile', data);
        }
        i++;
        tile++;
      }, 600);
    }
    animateCalls();
  }
});


//Trigger on next turn
socket.on('next turn', function(data) {

  //Assign Variables
  player = data.player;
  var heading = document.getElementById('player');
  var playerIcon = document.getElementById("playerIcon");
  var rollButton = document.getElementById("dice");

  //Display name of the character that has next turn
  displayNext(data.player);

  //Timeout while character name is on display before turn starts
  setTimeout(function() {

    //HTML changes and variable values change for active client
    if(data.player.id === socket.id) {
      heading.innerHTML = "Your Turn";
    } else {
      heading.innerHTML = data.player.character.name;
    }
    tile = data.player.tile-1;
    playerIcon.src = data.player.character.icon;

    //Button color for active button for active client
    if(data.player.id === socket.id) {
      rollButton.setAttribute("class", "[ game__button--roll ]");
    }

    drawBoard(data.tiles);
  }, 2000);
});

//trigger on roll again
socket.on('roll again', function(data) {

    //variables
    var heading = document.getElementById('player');
    var rollButton = document.getElementById("dice");

    //HTML changes
    if(data.player.id === socket.id) {
      heading.innerHTML = "Your Turn";
    } else {
      heading.innerHTML = data.player.character.name;
    }

    //new values
    tile = data.player.tile-1;
    drawBoard(data.tiles);

    //Button color for active button for active client
    if(data.player.id === socket.id) {
      rollButton.setAttribute("class", "[ game__button--roll ]");
    }
});


//Trigger on next trigger
socket.on('next trigger', function(data) {

  //Button color for active button for active client
  if(data.player.id === socket.id) {
    var endButton = document.getElementById("endButton");
    endButton.setAttribute("class", "[ game__button--roll game__button--align ]");
    canEnd = true;
  }
});

//trigger on alert
socket.on('alert', function(data) {
  alert(data.message);
});


//Trigger on winning
socket.on('winning', function(data) {

  //populate winning page
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

//Many of the functions below trigger when clicking on buttons

//Trigger join lobby for server when joining a game
function joinLobby(lobbyName) {
  socket.emit('join lobby', {
    lobbyName: lobbyName
  });
}

//Trigger create lobby for server when pressing "new game" on index
function createLobby() {
  socket.emit('create lobby', {
    lobbyName: gameName.value
  });

  //Trigger to refresh index for server after creating lobby
  socket.emit('refresh index');
}

//Trigger character selection for server when pressing "select characters" in lobby
function characterScreen() {
  socket.emit('character selection screen');
}

//Trigger select character for server when after choosing a character.
function selectCharacter(character) {
  var turn = document.getElementById("player");
  if (turn.innerHTML === "Your Turn") {
    socket.emit('select character', {
      characterId: character,
      playerId: socket.id
    });
  }
}

//Rolling dice when pressing roll
function rollDice() {
  //Get elements
  var turn = document.getElementById("player");
  var dice = document.getElementById("rollValue");
  var rollButton = document.getElementById("dice");

  //make button inactive
  rollButton.setAttribute("class", "[ game__button--rollInactive ]");

  //check turn
  if (turn.innerHTML === "Your Turn") {
    var i = 0;
    turn.innerHTML = "Moving";
    function roll() {

      //Roll animation
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
          //After animation trigger roll for server
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

//If possible trigger endTurn for server
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


//draw game board
function drawBoard(tiles) {
  if(canvas.getContext) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    //Draw each tile in a loop
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

//Animate movement of one tile forward
function animateBoard() {
  if(canvas.getContext) {
    //start animation
    var animation = requestAnimationFrame(animateBoard);

    context.clearRect(0, 0, canvas.width, canvas.height);
    position -= 5;

    //Draw one tile at a time
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
      //Stop animation when having moved 1 tile forward
      cancelAnimationFrame(animation);
      position = 0;
    }

  } else {
    alert("Youre browser does not support canvas");
  }
}

//Display name of character in canvas
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
