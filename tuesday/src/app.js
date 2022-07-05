const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('../public/'));

app.get('/',function(req, res) {
    res.sendFile('index.html', {root: '../public'});
});

io.sockets.on('connection', function(socket){
 
	socket.emit('setId', { id:socket.id });
	
    socket.on('disconnect', function(){
		// socket.broadcast.emit('deletePlayer', { id: socket.id });
    });	
	
	socket.on('init', function(data){
	});
	
	socket.on('update', function(data){
	});

});

http.listen(3000, function(){
    console.log('listening on *:3000');
  });