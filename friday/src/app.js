const express = require("express");
const app = express();
const http = require("http").Server(app);
// var socket = require("socket.io");
const io = require("socket.io")(http);

//central state of voxel-painter

app.use(express.static("../public/"));

app.get("/", function(req, res) {
    res.sendFile("index.html", { root: "../public" });
});

io.sockets.on("connection", newConnection);

http.listen(process.env.PORT || 3000, function() {
    console.log("listening on *:3000");
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
    let blockSize = 50;
    let blocks = {};
    let grid = [];

    for (var i = 0; i < DIM; i++) {
        let row = [];
        for (var j = 0; j < DIM; j++) {
            let column = [];
            for (var k = 0; k < DIM * 2; k++) {
                column.push(false);
            }
            row.push(column);
        }
        grid.push(row);
    }

    return { blockSize, DIM, grid, blocks };
}

let changes = [];
let DIM = 40;

let state = StartOver(DIM);

function newConnection(socket) {
    state = StartOver(DIM);

    let { id } = socket;

    socket.userData = { avatar: null, position: null, color: null };

    console.log("New player connected.", socket.id);

    socket.emit("updatePlayer", { id }); // send state
    socket.emit("restoreState", { state }); // send state

    socket.on("disconnect", function() {
        socket.broadcast.emit("player:left", { id: socket.id });
    });

    socket.on("init", initPlayer);
    socket.on("update", updatePlayer);
    socket.on("add", placeBlock);
    socket.on("remove", removeBlock);

    function initPlayer(data) {
        console.log(`socket.init ${data.avatar}`);
        for (let prop in data) {
            socket["userData"][prop] = data[prop];
        }
    }

    function updatePlayer(data) {
        // console.log('updatePlayer:: ', data.position)
        for (let prop in data) {
            socket["userData"][prop] = data[prop];
        }
    }

    function placeBlock(block) {
        state["blocks"][block.uuid] = block; // add block to the state right?
        checkGrid(state, block);
        socket.broadcast.emit("add", block);
    }

    function removeBlock(block) {
        delete state["blocks"][block.uuid];
        socket.broadcast.emit("remove", block);
    }
}

function checkGrid(state, block) {


    // updates the shape of the blocks based on adjacency rules 

    let { grid, DIM } = state;

    let { i, j, k } = getCoordinates(state, block);

    if (!checkDomain(i, j, k, DIM)) return;

    grid[i][j][k] = block.uuid;

    let neighbours = check2DNeighbours(state, i, j, k)

    if (!neighbours) {

        // 2. make block into a spire,

        console.log('spire:', block.uuid)
        block.shape = "cylinder";
        changes.push(block);

        // 3. we need to check all the blocks below it and make theme cubes 

        for (var j0 = j - 1; j0 >= 0; j0--) {

            if (!grid[i][j0][k]) break
            let uuid = grid[i][j0][k]
            let supportBlock = state["blocks"][uuid]
            supportBlock.shape = "cube";
            changes.push(supportBlock);

        }

    }

    if (Array.isArray(neighbours)) {

        neighbours.forEach(uuid => {

            let supportBlock = state["blocks"][uuid]
            supportBlock.shape = "cube";
            changes.push(supportBlock);

        })

    }

}




function check2DNeighbours(state, i, j, k) {


    let arr = []


    let { grid, DIM } = state;

    let a = i + 1;
    let b = i - 1;

    let c = k + 1;
    let d = k - 1;

    if (a > DIM - 1) return true;
    if (b < 0) return true;
    if (c > DIM - 1) return true;
    if (d < 0) return true;

    if (grid[a][j][k]) arr.push(grid[a][j][k]);
    if (grid[b][j][k]) arr.push(grid[b][j][k])

    if (grid[a][j][c]) arr.push(grid[a][j][c]);
    if (grid[i][j][c]) arr.push(grid[i][j][c]);
    if (grid[b][j][c]) arr.push(grid[b][j][c]);

    if (grid[a][j][d]) arr.push(grid[a][j][d]);
    if (grid[i][j][d]) arr.push(grid[i][j][d]);
    if (grid[b][j][d]) arr.push(grid[b][j][d]);

    if (arr.length > 0) return arr 

    return false 

}

function checkDomain(i, j, k, DIM) {
    if (i < 0 || i > DIM - 1) return false;
    if (j < 0 || j > DIM - 1) return false;
    if (k < 0 || k > DIM - 1) return false;
    return true;
}

function getCoordinates(state, object) {
    let { blockSize, DIM, blocks } = state;
    let { position } = object;
    let { x, y, z } = position;
    let i = (x + (DIM * blockSize) / 2) / blockSize - 0.5;
    let j = (y + (DIM * blockSize) / 2) / blockSize - 0.5;
    let k = (z + (DIM * blockSize) / 2) / blockSize - 0.5;
    return { i, j, k };
}

setInterval(function() {
    const clients = Array.from(io.sockets.sockets).map((socket) => socket[1]);
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
    if (pack.length > 0) io.emit("remoteData", { pack, changes });

    changes = [];
}, 40);