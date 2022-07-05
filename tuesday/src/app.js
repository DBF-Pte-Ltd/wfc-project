const express = require('express');
const app = express();
const http = require('http').Server(app);
var socket = require("socket.io");
const io = socket(http);

//central state of voxel-painter
const state = {}

app.use(express.static('../public/'));

app.get('/',function(req, res) {
    res.sendFile('index.html', {root: '../public'});
});

io.sockets.on('connection', newConnection);

http.listen(3000, function(){
    console.log('listening on *:3000');
});


function newConnection(socket){

	console.log('New player connected.', socket.id)
 
	socket.emit('player:joined', { id:socket.id });
	
    socket.on('disconnect', function(){
		socket.broadcast.emit('player:left', { id: socket.id });
    });	
	
	/* socket.on('init', function(data){
	});
	
	socket.on('update', function(data){
	}); */

	socket.on("add", placeBlock);
	socket.on("remove", removeBlock);

	function placeBlock(data) {
		console.log('add:: ', data)
		socket.broadcast.emit("add", data);
	}
	
	function removeBlock(data) {
		console.log('remove:: ', data)
		socket.broadcast.emit("remove", data);
	}

}



