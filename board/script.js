var canvas = document.getElementById("canvas");
var parent = document.getElementById("canvasParent");
var context = canvas.getContext("2d");
//Set size
canvas.width = parent.offsetWidth-33;
canvas.height = 100;

var position = 0;
var tile = 5;

window.onresize = function(event) {
    canvas.width = parent.offsetWidth-33;
    drawBoard();
};

drawBoard();


animateBoard();

function drawBoard() {
  if(canvas.getContext) {

    context.clearRect(0, 0, canvas.width, canvas.height);
    //Stroke
    for(var i = tile-1; i < 30; i++) {
      context.beginPath();
      context.rect((i-tile+1)*100, 0, 100, 100);
      context.closePath();
      context.stroke();
      context.font = "30px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(i+1, (i-tile+1)*100+50, 50);
    }

  } else {
    alert("Youre browser does not support canvas");
  }
}

function animateBoard() {
  if(canvas.getContext) {

    var animation = requestAnimationFrame(animateBoard);

    context.clearRect(0, 0, canvas.width, canvas.height);
    position -= 2;
    
    //Stroke
    for(var i = tile-1; i < 30; i++) {
      context.beginPath();
      context.rect((i-tile+1)*100+position, 0, 100, 100);
      context.closePath();
      context.stroke();
      context.font = "30px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(i+1, (i-tile+1)*100+50+position, 50);
    }

    if(position === -100) {
      cancelAnimationFrame(animation);
      position = 0;
    }

  } else {
    alert("Youre browser does not support canvas");
  }
}
