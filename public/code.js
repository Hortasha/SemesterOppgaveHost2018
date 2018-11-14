//Variables
//Elements
var standardStart = document.getElementById("standardStart");
var gameName = document.getElementById("gameName");
var serverList = document.getElementById("serverList");
var body = document.getElementById("body");
var lobbyButtons = document.getElementsByClassName("lobby");

//Socket
var socket = io();

standardStart.addEventListener("click", function() {
  socket.emit('create game', {
    name: gameName.value,
    type: "default"
  });
});

function start() {
  socket.emit('start');
}

//listen
socket.on('create game failed', function(data) {
  console.log("Failed to create game with the name " + data.name + ". Try another name.");
});

socket.on('enter lobby', function(data) {
  refreshLobby(data);
});

socket.on('recive lobbys', function(data) {
  serverList.innerHTML = "";
  for (var i = 0; i < data.length; i++) {
    serverList.innerHTML += '<button type="button" onclick="enterLobby(\'' + data[i].name + '\')">' + data[i].name + '</button>';
  }
});

socket.on('character selection', function(data) {
  body.innerHTML = "<h1>Player 1 chooses character</h1>";
  getJSON()
    .then(function (result) {
      console.log(result);
      body.innerHTML += "<p>" + result[0].aliases[0] + "</p>";
    });
});

socket.on('choose character', function(data) {
  for(var i = 0; i < data.room.players.length; i++) {
    if(data.room.players[i] === data.player) {
      //Player choosing character
    }
  }
});

//functions
function requestLobbys() {
  socket.emit('request lobbys');
}

function refreshLobby(data) {
  body.innerHTML = "<h1>Players in lobby</h1>";
  for (var i = 0; i < data.players.length; i++) {
    body.innerHTML += "<p>" + data.players[i].id + "</p>";
  }
  body.innerHTML += '<button type="button" onclick="start()">Start</button>';
}

function enterLobby(lobbyName) {
  socket.emit('join lobby', {
    name: lobbyName
  });
}

function getJSON() {
 return new Promise(

 resolve => {
   fetch('https://anapioficeandfire.com/api/characters')
     .then(function(response) {
       return response.json();
     })
     .then(function(myJson) {
       resolve(myJson);
     });
 },

 reject => {
   reject("Rip API");
 });
}

//Calls
requestLobbys();
