var socket = io();

//Elements
var standardStart = document.getElementById("standardStart");
var gameName = document.getElementById("gameName");

//Variables
standardStart.addEventListener("click", function() {
  socket.emit('createGame', {
    name: gameName.value,
    type: "default"
  });
});

//listen

socket.on('createGameFail', function(data) {
  console.log("Failed to create game with the name " + data.name + ". Try another name.");
});
