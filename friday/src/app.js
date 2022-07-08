const express = require("express");
const app = express();
const http = require("http").Server(app);
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



// Tile class
class Tile {
    constructor(edges) {
        // Image
        // this.img = img;
        // Edges
        this.edges = edges;
        // Valid neighbors
        this.up = [];
        this.right = [];
        this.down = [];
        this.left = [];
    }

    // Find the valid neighbors
    analyze(tiles) {
        for (let i = 0; i < tiles.length; i++) {
            let tile = tiles[i];
            // UP
            if (compareEdge(tile.edges[2], this.edges[0])) {
                this.up.push(i);
            }
            // RIGHT
            if (compareEdge(tile.edges[3], this.edges[1])) {
                this.right.push(i);
            }
            // DOWN
            if (compareEdge(tile.edges[0], this.edges[2])) {
                this.down.push(i);
            }
            // LEFT
            if (compareEdge(tile.edges[1], this.edges[3])) {
                this.left.push(i);
            }
        }
    }

    // Rotate a tile and its edges to create a new one
    rotate(num, p5) {

        // Rotate edges
        const newEdges = [];
        const len = this.edges.length;
        for (let i = 0; i < len; i++) {
            newEdges[i] = this.edges[(i - num + len) % len];
        }
        return new Tile(newEdges);
    }
}



function StartOver(DIM) {

    let blockSize = 50;
    let blocks = {};
    let grid = [];

    // 3D Matrix 

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


    // 2D Matrix 


    let grid2D = wfcInitialize({ blockSize, DIM, blocks })

    return { blockSize, DIM, grid, blocks, grid2D };

}


let changes = [];
let DIM = 40;

let state = StartOver(DIM);

function newConnection(socket) {
    
    state = StartOver(DIM);

    console.log('....')


    let { id } = socket;

    socket.userData = { avatar: null, position: null, color: null };
    socket.emit("updatePlayer", { id }); // send state
    socket.emit("restoreState", { state }); // send state

    socket.on("disconnect", function() {
        socket.broadcast.emit("player:left", { id: socket.id });
    });

    socket.on("init", initPlayer);
    socket.on("update", updatePlayer);
    socket.on("add", placeBlock);
    socket.on("remove", removeBlock);



    let {grid2D} = state 
    state.grid2D = wfcRun(grid2D, DIM, 10) 

    console.log('updateTileset!')
    socket.emit("updateTileset", grid2D); // send state

    

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

        updateShape(state, block);
        updateTexture(state, block)

        socket.broadcast.emit("add", block);

    }

    function removeBlock(block) {
        delete state["blocks"][block.uuid];

        socket.broadcast.emit("remove", block);

        let { grid, DIM } = state;
        let { i, j, k } = getCoordinates(state, block);
        if (!checkDomain(i, j, k, DIM)) return;
        grid[i][j][k] = false
    }
}




function updateTexture(state, block) {



    let { grid, DIM } = state;

    let { i, j, k } = getCoordinates(state, block);
    if (!checkDomain(i, j, k, DIM)) return;
    grid[i][j][k] = block.uuid;

    let neighbours = check3DNeighbours(state, i, j, k)

    console.log('neighbours:::', neighbours)


    let categories = []
    let variations = []
    let randomTexture = false
    let needsTexture = [block]
    let { category, variation } = getRandomTexture()

    if (neighbours) {



        neighbours.forEach(uuid => {


            let neighbour = state["blocks"][uuid]

            if (neighbour === undefined) return


            if ((neighbour.category) && (neighbour.variation)) {

                categories.push(neighbour.category)
                variations.push(neighbour.variation)
                needsTexture.push(neighbour)

            } else {

                // needsTexture.push(neighbour)

            }


        })





        if (categories.length > 0) {

            console.log('match!')
            if (Math.random() > 0.1) category = categories[Math.floor(Math.random() * categories.length)];
            if (Math.random() > 0.1) variation = variations[Math.floor(Math.random() * variations.length)];

        }

    }

    needsTexture.forEach(o => {

        o.category = category
        o.variation = variation

    })

    console.log(category, variation, needsTexture.length)



    changes.push(...needsTexture)

}


function getRandomTexture() {


    let categories = ["commercial", "industrial", "institutional", "office", "parking", "recreational", "residential", ];
    let variations = ["1-20", "1-30", "1-50", "1-60", "1-80", "1-90"];
    let category = categories[Math.floor(Math.random() * categories.length)];
    let variation = variations[Math.floor(Math.random() * variations.length)];

    return { category, variation }

}

function updateShape(state, block) {


    // updates the shape of the blocks based on adjacency rules 

    let { grid, DIM } = state;
    let { i, j, k } = getCoordinates(state, block);
    if (!checkDomain(i, j, k, DIM)) return;
    grid[i][j][k] = block.uuid; // 

    // grid[i][j][k] = false  


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
            if (supportBlock === undefined) return
            supportBlock.shape = "cube";
            changes.push(supportBlock);

        })

    }

}




function check3DNeighbours(state, i, j, k) {


    let arr = []
    let { grid, DIM } = state;

    let a = i + 1;
    let b = i - 1;

    let c = k + 1;
    let d = k - 1;

    let e = j + 1
    let f = j - 1

    if (a > DIM - 1) a = DIM - 1
    if (b < 0) b = 0
    if (c > DIM - 1) c = DIM - 1
    if (d < 0) d = 0

    if (e < DIM - 1) {

        if (grid[a][e][k]) arr.push(grid[a][e][k]);
        if (grid[i][e][k]) arr.push(grid[a][e][k]);
        if (grid[b][e][k]) arr.push(grid[b][e][k])

        if (grid[a][e][c]) arr.push(grid[a][e][c]);
        if (grid[i][e][c]) arr.push(grid[i][e][c]);
        if (grid[b][e][c]) arr.push(grid[b][e][c]);

        if (grid[a][e][d]) arr.push(grid[a][e][d]);
        if (grid[i][e][d]) arr.push(grid[i][e][d]);
        if (grid[b][e][d]) arr.push(grid[b][e][d]);

    }

    if (grid[a][j][k]) arr.push(grid[a][j][k]);
    if (grid[b][j][k]) arr.push(grid[b][j][k])

    if (grid[a][j][c]) arr.push(grid[a][j][c]);
    if (grid[i][j][c]) arr.push(grid[i][j][c]);
    if (grid[b][j][c]) arr.push(grid[b][j][c]);

    if (grid[a][j][d]) arr.push(grid[a][j][d]);
    if (grid[i][j][d]) arr.push(grid[i][j][d]);
    if (grid[b][j][d]) arr.push(grid[b][j][d]);



    if (f >= 0) {

        if (grid[a][f][k]) arr.push(grid[a][f][k]);
        if (grid[i][f][k]) arr.push(grid[a][f][k]);
        if (grid[b][f][k]) arr.push(grid[b][f][k])

        if (grid[a][f][c]) arr.push(grid[a][f][c]);
        if (grid[i][f][c]) arr.push(grid[i][f][c]);
        if (grid[b][f][c]) arr.push(grid[b][f][c]);

        if (grid[a][f][d]) arr.push(grid[a][f][d]);
        if (grid[i][f][d]) arr.push(grid[i][f][d]);
        if (grid[b][f][d]) arr.push(grid[b][f][d]);

    }


    if (arr.length > 0) return arr

    return false

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



console.log('wfc')




function wfcInitialize({ blockSize, DIM, blocks}) {



    let tiles = []

    let rules = [
        ["BBB", "BBB", "BBB", "BBB"],
        ["BBB", "BCB", "BBB", "BBB"],
        ["BBB", "BDB", "BBB", "BDB"],
        ["ABB", "BCB", "BBA", "AAA"],
        ["ABB", "BBB", "BBB", "BBA"],
        ["BBB", "BCB", "BBB", "BCB"],
        ["BDB", "BCB", "BDB", "BCB"],
        ["BDB", "BBB", "BCB", "BBB"],
        ["BCB", "BCB", "BBB", "BCB"],
        ["BCB", "BCB", "BCB", "BCB"],
        ["BCB", "BCB", "BBB", "BBB"],
        ["BBB", "BCB", "BBB", "BCB"]
    ]

    rules.forEach(arr => tiles.push(new Tile(arr)))


    for (let i = 2; i < 11; i++) {
        for (let j = 1; j < 4; j++) {
            tiles.push(tiles[i].rotate(j, this));
        }
    }

    // Generate the adjacency rules based on edges
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        tile.analyze(tiles);
    }

    // Start over
    let grid = resetWfc({ blockSize, DIM, blocks,tiles });
    return { rules, tiles, grid }

}





function wfcRun({ rules, tiles, grid }, DIM, steps) {

    for (var i = steps; i >= 0; i--) {
        grid = step({grid, rules, DIM, tiles})
        // console.log(i)
    }

    console.log('done!', grid)

    return {rules,tiles,grid}
}





function step({grid, rules, DIM, tiles}) {



    /*
      // let DIM = 20

      // step 1: check end condition
      if (wfcDone) return;

      // step 2: check modifiers
      wfcModifiers.forEach((o) => wfcModify(game.state, grid, o));
      wfcModifiers = [];

      // step 3: run wfc

      */

    let gridCopy = grid.slice(); // Make a copy of grid
    gridCopy = gridCopy.filter((a) => !a.collapsed); // Remove any collapsed cells

    // console.log(gridCopy.length)

    if (gridCopy.length == 0) {
        // The algorithm has completed if everything is collapsed
        wfcDone = true;
        return;
    }

    grid = wfc({ grid, gridCopy, DIM, tiles });


    return grid

}


function resetWfc({ blockSize, DIM, blocks,tiles }) {



    let grid = [];

    for (let i = 0; i < DIM * DIM; i++) {
        grid[i] = new Cell(tiles.length);

    }

    // placeBlockCells(game.state, Object.values(blocks));

    return grid
}





// Function to reverse a string
function reverseString(s) {
    let arr = s.split("");
    arr = arr.reverse();
    return arr.join("");
}

// Function to compare two edges
function compareEdge(a, b) {
    return a == reverseString(b);
}


function randomElement(arr) {


    return arr[Math.floor(Math.random() * arr.length)]


}

// Check if any element in arr is in valid, e.g.
// VALID: [0, 2]
// ARR: [0, 1, 2, 3, 4]
// result in removing 1, 3, 4
// Could use filter()!
function checkValid(arr, valid) {
    for (let i = arr.length - 1; i >= 0; i--) {
        let element = arr[i];
        if (!valid.includes(element)) {
            arr.splice(i, 1);
        }
    }
}

function wfc({ grid, gridCopy, DIM, tiles }) {
    // Pick a cell with least entropy

    // Sort by entropy
    gridCopy.sort((a, b) => {
        return a.options.length - b.options.length;
    });

    // Keep only the lowest entropy cells

    let len = gridCopy[0].options.length;
    let stopIndex = 0;
    for (let i = 1; i < gridCopy.length; i++) {
        if (gridCopy[i].options.length > len) {
            stopIndex = i;
            break;
        }
    }
    if (stopIndex > 0) gridCopy.splice(stopIndex);

    // Collapse a cell
    const cell = randomElement(gridCopy)
    cell.collapsed = true;
    const pick = randomElement(cell.options)
    cell.options = [pick];

    if (cell.options[0] === undefined) {
        return;
    }

    // Calculate entropy
    const nextGrid = [];
    for (let j = 0; j < DIM; j++) {
        for (let i = 0; i < DIM; i++) {
            let index = i + j * DIM;
            if (grid[index].collapsed) {
                nextGrid[index] = grid[index];
            } else {
                let options = new Array(tiles.length).fill(0).map((x, i) => i);
                // Look up
                if (j > 0) {
                    let up = grid[i + (j - 1) * DIM];
                    let validOptions = [];
                    for (let option of up.options) {
                        let valid = tiles[option].down;
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }
                // Look right
                if (i < DIM - 1) {
                    let right = grid[i + 1 + j * DIM];
                    if (right == undefined) console.log("right undefined");
                    let validOptions = [];
                    for (let option of right.options) {
                        let valid = tiles[option].left;
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }
                // Look down
                if (j < DIM - 1) {
                    let down = grid[i + (j + 1) * DIM];
                    let validOptions = [];
                    for (let option of down.options) {
                        // console.log(tiles[option])
                        if (tiles[option] == undefined) {
                            console.log(down);
                            console.log(option);
                        }
                        let valid = tiles[option].up; // getting erros here
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }
                // Look left
                if (i > 0) {
                    let left = grid[i - 1 + j * DIM];
                    let validOptions = [];
                    for (let option of left.options) {
                        let valid = tiles[option].right;
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }

                // I could immediately collapse if only one option left?
                nextGrid[index] = new Cell(options);
            }
        }
    }

    grid = nextGrid;

    return grid;
}