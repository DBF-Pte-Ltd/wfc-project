// Wave Function Collapse (tiled model)
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/challenges/171-wave-function-collapse
// https://youtu.be/0zac-cDzJwA

// Code from Challenge: https://editor.p5js.org/codingtrain/sketches/pLW3_PNDM
// Corrected and Expanded: https://github.com/CodingTrain/Wave-Function-Collapse


// Updated by DJCLDY & TEJASDOTCHAVAN

// Array for tiles and tile images
const tiles = [];
const tileImages = [];

// Current state of the grid
let grid = [];

// Width and height of each cell
const DIM = 16;

// Load images
function preload() {
    const path = "circuit";
    for (let i = 0; i < 13; i++) {
        tileImages[i] = loadImage(`${path}/${i}.png`);
    }
}

function setup() {
    createCanvas(800, 800);

    // Create and label the tiles  
    tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"]); // text part is the ruleset 
    tiles[1] = new Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"]);
    tiles[2] = new Tile(tileImages[2], ["BBB", "BCB", "BBB", "BBB"]);
    tiles[3] = new Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"]);
    tiles[4] = new Tile(tileImages[4], ["ABB", "BCB", "BBA", "AAA"]);
    tiles[5] = new Tile(tileImages[5], ["ABB", "BBB", "BBB", "BBA"]);
    tiles[6] = new Tile(tileImages[6], ["BBB", "BCB", "BBB", "BCB"]);
    tiles[7] = new Tile(tileImages[7], ["BDB", "BCB", "BDB", "BCB"]);
    tiles[8] = new Tile(tileImages[8], ["BDB", "BBB", "BCB", "BBB"]);
    tiles[9] = new Tile(tileImages[9], ["BCB", "BCB", "BBB", "BCB"]);
    tiles[10] = new Tile(tileImages[10], ["BCB", "BCB", "BCB", "BCB"]);
    tiles[11] = new Tile(tileImages[11], ["BCB", "BCB", "BBB", "BBB"]);
    tiles[12] = new Tile(tileImages[12], ["BBB", "BCB", "BBB", "BCB"]);

    // Rotate tiles
    // TODO: eliminate redundancy
    for (let i = 2; i < 14; i++) {
        for (let j = 1; j < 4; j++) {
            tiles.push(tiles[i].rotate(j));
        }
    }

    // Generate the adjacency rules based on edges
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        tile.analyze(tiles);
    }

    // Start over
    startOver();
}



function subtract() {
    console.log('mousePressed')
    let w = width / DIM
    let h = height / DIM
    let m = Math.floor(mouseX / width * DIM)
    let j = Math.floor(mouseY / height * DIM)


    for (var i = 0; i < DIM; i++) {

        let index = i + j * DIM;
        grid[index] = new Cell(tiles.length); // create cells with entropy 14 

    }

    for (var k = 0; k < DIM; k++) {

        let index = m + k * DIM;
        grid[index] = new Cell(tiles.length); // create cells with entropy 14 

    }

}

function mousePressed() {

    subtract()

    // grid[index-1].collapsed = false 
    // grid[index].collapsed = false 
    // grid[index+1].collapsed = false 

}

function startOver() {
    // Create cell for each spot on the grid
    for (let i = 0; i < DIM * DIM; i++) {
        grid[i] = new Cell(tiles.length); // create cells with entropy 14 

    }
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


function draw() {
    background(0);

    // Draw the grid
    const w = width / DIM;
    const h = height / DIM;
    for (let j = 0; j < DIM; j++) {
        for (let i = 0; i < DIM; i++) {
            let cell = grid[i + j * DIM];
            if (!cell.collapsed) {
                fill(0);
                noStroke()
                // stroke(100);
                rect(i * w, j * h, w, h);

            } else {
                // fill(0);
                // stroke(100);
                // rect(i * w, j * h, w, h);

                let index = cell.options[0];
                // image(tiles[index].img, i * w, j * h, w, h);
                customTile(tiles[index].edges, i * w, j * h, w, h)
            }
        }
    }


    // Make a copy of grid
    let gridCopy = grid.slice();
    // Remove any collapsed cells
    gridCopy = gridCopy.filter((a) => !a.collapsed);

    // The algorithm has completed if everything is collapsed
    if (grid.length == 0) {
        return;
    }

    // Pick a cell with least entropy

    // Sort by entropy
    gridCopy.sort((a, b) => {
        return a.options.length - b.options.length;
    });

    // Keep only the lowest entropy cells

    if (gridCopy.length === 0) return startOver()

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
    const cell = random(gridCopy);
    cell.collapsed = true;
    const pick = random(cell.options);
    if (pick === undefined) {
        startOver();
        return;
    }
    cell.options = [pick];

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
                        let valid = tiles[option].up;
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

    mouseHover()



}



function mouseHover() {
    // subtract()
    let w = width / DIM
    let h = height / DIM



    let x = Math.floor(mouseX / width * DIM) * w
    let y = Math.floor(mouseY / height * DIM) * h

    // noFill()
    // strokeWeight(5)
    // stroke(34,155,215)
    // rect(x, y, w, h)
    // strokeWeight(1)
    // noStroke()


    // createTile(x,y, ["BBB", "BCB", "BBB", "BCB"])


}

function customTile(edges, x, y, w, h) {

    let top = edges[0]
    let right = edges[1]
    let bottom = edges[2]
    let left = edges[3]
    rectMode(CENTER)

    //  // A = purple 1 
    //  // B = purple 2  
    //  // C = pink 
    //  // D = light blue 


    plotElement('top', top, x, y, w, h)
    plotElement('right', right, x, y, w, h)
    plotElement('bottom', bottom, x, y, w, h)
    plotElement('left', left, x, y, w, h)

    rectMode(CORNER)


    // // customTile(tiles[index].edges)


    //  // 
    //  // RIGHT

    // noFill()
    // strokeWeight(5)
    // stroke(random(255),random(255),random(255))
    // rect(x, y, w, h)
    // strokeWeight(1)
    // noStroke()





}


function plotElement(str, data, x, y, w, h) {

  console.log(str)

    let fx, fy

    switch (str) {
        case 'top':

            fx = (x, y, w, h, i) => x + w / 3 * i
            fy = (x, y, w, h, i) => y


            break;
        case 'right':
            fx = (x, y, w, h, i) => x + w
            fy = (x, y, w, h, i) => y + h / 3 * (i)
            // code block
            break;
        case 'bottom':
            fx = (x, y, w, h, i) => x + w / 3 * (i)
            fy = (x, y, w, h, i) => y + h
            // code block
            break;
        case 'left':
            fx = (x, y, w, h, i) => x
            fy = (x, y, w, h, i) => y + h / 3 * i
            // code block
            break;
        default:
            // code block
    }
    let w0 = w / 3
    let h0 = h / 3

    for (var i = 0; i < 3; i++) {

        let posX = fx(x, y, w, h, i)
        let posY = fy(x, y, w, h, i)


        switch (data[i]) {
            case 'A':
                // code block
                   strokeWeight(2)
                stroke('red')
                // rect(x, y, w, h)
                break;
            case 'B':
               strokeWeight(5)
                stroke('blue')
                // code block
                break;
            case 'C':
               strokeWeight(1)
                stroke('green')
                // code block
                break;
            case 'D':
               strokeWeight(3)
                stroke('purple')
                // code block
                break;
            default:
                // code block
        }

     

        line(posX, posY, x+w/2, y+h/2)

        // rect(posX, posY, w / 3, h / 3)

    }

}