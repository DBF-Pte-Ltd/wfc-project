const express = require('express');
const app = express();
const http = require('http').Server(app);
// var socket = require("socket.io");
const io = require("socket.io")(http);

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

	socket.userData = { avatar:null, position: null, color: null};

	console.log('New player connected.', socket.id)
 
	socket.emit('player:joined', { id:socket.id });
	// socket.broadcast.emit('player:new-remote', { id: socket.id });
	
    socket.on('disconnect', function(){
		socket.broadcast.emit('player:left', { id: socket.id });
    });	

	socket.on("init", initPlayer)
	socket.on("update", updatePlayer);
	socket.on("add", placeBlock);
	socket.on("remove", removeBlock);

	function initPlayer(data) {
		console.log(`socket.init ${data.avatar}`);
		socket.userData.avatar = data.avatar;
		socket.userData.color = data.color;
		socket.userData.position = data.position;
		socket.userData.hands = data.hands;
	}

	function updatePlayer(data) {
		// console.log('updatePlayer:: ', data.position)
		socket.userData.position = data.position;
		socket.userData.hands = data.hands;
		// socket.broadcast.emit("update", data);
	}

	function placeBlock(data) {
		// console.log('add:: ', data)
		socket.broadcast.emit("add", data);
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
				hands: socket.userData.hands,
			});    
		}
    }
	// console.log('Sending remote data:: ', pack.map(p => p.position))
	if (pack.length>0) io.emit('remoteData', pack);
}, 40);



