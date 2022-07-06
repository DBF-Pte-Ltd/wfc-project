const express = require('express');
const app = express();
const http = require('http').Server(app);
// var socket = require("socket.io");
const io = require("socket.io")(http);

//central state of voxel-painter


app.use(express.static('../public/'));

app.get('/',function(req, res) {
    res.sendFile('index.html', {root: '../public'});
});

io.sockets.on('connection', newConnection);

http.listen(3000, function(){
    console.log('listening on *:3000');
});




// Class for a cell
class Cell {
  constructor(value) {
    // Is it collapsed?
    this.collapsed = false;

    // Initial options via constructor
    if (value instanceof Array) {
      this.options = value;
    } else {
      // or all options to start
      this.options = [];
      for (let i = 0; i < value; i++) {
        this.options[i] = i;
      }
    }
  }
}




function StarOver(DIM) {

	let grid = []

    // Create cell for each spot on the grid
    for (let i = 0; i < DIM * DIM * DIM; i++) {
        grid[i] = new Cell(5);
    }


    return { DIM, grid }

}

const state = StarOver(20)

function newConnection(socket){


	let {id} = socket

	socket.userData = { avatar:null, position: null, color: null};

	console.log('New player connected.', socket.id)


    socket.emit('updatePlayer', { id }); // send state 
    socket.emit('restoreState', { state }); // send state 
    
	
    socket.on('disconnect', function(){
		socket.broadcast.emit('player:left', { id: socket.id });
    });	

	socket.on("init", initPlayer)
	socket.on("update", updatePlayer);
	socket.on("add", placeBlock);
	socket.on("remove", removeBlock);

	function initPlayer(data) {
		console.log(`socket.init ${data.avatar}`);
		for (let prop in data){
			socket['userData'][prop] = data[prop]
		}
	}

	function updatePlayer(data) {
		// console.log('updatePlayer:: ', data.position)
		for (let prop in data){
			socket['userData'][prop] = data[prop]
		}
	}

	function placeBlock(block) {

		state[block.uuid] = block 
		socket.broadcast.emit("add", block);
	}
	
	function removeBlock(data) {
		// console.log('remove:: ', data)
		socket.broadcast.emit("remove", data);
	}

}



setInterval(function(){
	const clients = Array.from(io.sockets.sockets).map(socket => socket[1]);
    let pack = [];
	
	
    for(const socket of clients){
		// console.log('Remote socket:: ', socket.userData)
		//this didn't work for some reason
		// const socket = nsp.connected[id];

		if (socket.userData.avatar !== null){
			pack.push({
				id: socket.id,
				avatar: socket.userData.avatar,
				color: socket.userData.color,
				position: socket.userData.position,
			});    
		}
    }
	// console.log('Sending remote data:: ', pack.map(p => p.position))
	if (pack.length>0) io.emit('remoteData', pack);
}, 40);






