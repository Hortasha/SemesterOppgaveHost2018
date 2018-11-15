//Variables
//Elements
var gameName = document.getElementById("gameName");
var serverList = document.getElementById("serverList");
var body = document.getElementById("body");
var lobbyButtons = document.getElementsByClassName("lobby");

//Socket
var socket = io();

socket.on('refresh index', function(data) {
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

socket.on('character selection screen', function(data) {

});

socket.emit('refresh index');

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
