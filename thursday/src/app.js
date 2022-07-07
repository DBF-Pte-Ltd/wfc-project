const express = require('express');
const app = express();
const http = require('http').Server(app);
// var socket = require("socket.io");
const io = require("socket.io")(http);

//central state of voxel-painter


app.use(express.static('../public/'));

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: '../public' });
});

io.sockets.on('connection', newConnection);

http.listen(3000, function() {
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




function StartOver(DIM) {


    let blockSize = 50
    let blocks = {}
    let grid = []

    for (var i = 0; i < DIM; i++) {
        let row = []
        for (var j = 0; j < DIM; j++) {
            let column = []
            for (var k = 0; k < DIM * 2; k++) {
                column.push(false)
            }
            row.push(column)
        }
        grid.push(row)
    }

    return { blockSize, DIM, grid, blocks }

}

let changes = {
    add: {},
    remove: {}
}

let state = StartOver(20)

function newConnection(socket) {

    state = StartOver(20)

    let { id } = socket

    socket.userData = { avatar: null, position: null, color: null };

    console.log('New player connected.', socket.id)


    socket.emit('updatePlayer', { id }); // send state 
    socket.emit('restoreState', { state }); // send state 


    socket.on('disconnect', function() {
        socket.broadcast.emit('player:left', { id: socket.id });
    });

    socket.on("init", initPlayer)
    socket.on("update", updatePlayer);
    socket.on("add", placeBlock);
    socket.on("remove", removeBlock);

    function initPlayer(data) {
        console.log(`socket.init ${data.avatar}`);
        for (let prop in data) {
            socket['userData'][prop] = data[prop]
        }
    }

    function updatePlayer(data) {
        // console.log('updatePlayer:: ', data.position)
        for (let prop in data) {
            socket['userData'][prop] = data[prop]
        }
    }

    function placeBlock(block) {
        state['blocks'][block.uuid] = block // add block to the state right? 

        checkGrid(state, block)

        changes['add'].push(block) // add block to the state right? 
        socket.broadcast.emit("add", block);
    }

    function removeBlock(block) {
        delete state['blocks'][block.uuid]
        socket.broadcast.emit("remove", block);
    }

}


function checkGrid({grid}, block) {

	console.log('check grid!')
	let { i, j, k } = block
	grid[i][j][k] = true 



}



function getCoordinates(state, object) {


    let { blockSize, DIM, blocks } = state
    let { position } = object
    let { x, y, z } = position
    let i = (x + DIM * blockSize / 2) / blockSize - 0.5
    let j = (y + DIM * blockSize / 2) / blockSize - 0.5
    let k = (z + DIM * blockSize / 2) / blockSize - 0.5


    return { i, j, k }
}



setInterval(function() {
    const clients = Array.from(io.sockets.sockets).map(socket => socket[1]);
    let pack = [];


    for (const socket of clients) {
        // console.log('Remote socket:: ', socket.userData)
        //this didn't work for some reason
        // const socket = nsp.connected[id];

        if (socket.userData.avatar !== null) {
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
    if (pack.length > 0) io.emit('remoteData', pack);

    changes.add = []
    changes.remove = []

}, 40);