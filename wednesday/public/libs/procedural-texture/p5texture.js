console.log('p5texture.js')

var container;
var camera, scene, renderer, controls;
var map
let planeMesh
let myP5

// Array for tiles and tile images
const tiles = [];
const tileImages = [];
let grid = [];
let animatedMesh = null


function initP5js(scene) {

    console.log('initP5js')



    const geometry = new THREE.PlaneGeometry(20 * 50, 20 * 50);
    geometry.rotateX(-Math.PI / 2);


    let name = 'p5jsCanvas'

    let promise = new Promise(resolve => {

        myP5 = initP5Canvas(name)
        setTimeout(() => resolve(myP5), 10)

    });

    promise.then(function(result) {


            // let p5 = result
            let myP5 = result
            let texture = new THREE.CanvasTexture(myP5.oCanvas)
            animatedMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
            animatedMesh.material.needsUpdate = true;

            scene.add(animatedMesh)



        },

        error => alert(error)

    )



}





function updateTexture(canvas, mesh) {


    let texture = new THREE.CanvasTexture(canvas)

    let material = new THREE.MeshBasicMaterial({
        map: texture,
        // opacity: 1,
        // transparent: true
    });
    mesh.material = material

    return mesh

}




function initP5Canvas(name) {



    let sketch = function(p) {

        p.oCanvas

        p.preload = function() {

            console.log('PRELOAD')
            const path = "libs/procedural-texture/circuit";
            for (let i = 0; i < 13; i++) {
                tileImages[i] = p.loadImage(`${path}/${i}.png`);


            }
        }

        p.setup = function() {

            console.log('create canvas')

            let cnv = p.createCanvas(512, 512)
            cnv.id(name);
            p.oCanvas = document.getElementById(name)
            p.background(0)

            // p.drawRandom()
            // Create and label the tiles
            tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"]); // 
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
                    tiles.push(tiles[i].rotate(j, p));
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

        p.drawRandom = function() {

            // for (var i = 0; i < 100; i++) {

            //     p.fill(p.random(255), p.random(255), p.random(255))
            //     p.circle(p.random(p.width), p.random(p.height), 25)

            // }

        }

        p.draw = function() {

            let DIM = 40

            // Draw the grid
            const w = p.width / DIM;
            const h = p.height / DIM;
            for (let j = 0; j < DIM; j++) {
                for (let i = 0; i < DIM; i++) {
                    let cell = grid[i + j * DIM];
                    if (cell.collapsed) {
                        let index = cell.options[0];
                        p.image(tiles[index].img, i * w, j * h, w, h);
                    } else {
                        p.fill(0);
                        p.stroke(100);
                        p.rect(i * w, j * h, w, h);
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


            if (!gridCopy[0]) {

              // startOver()
              return  
            }  
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
            const cell = p.random(gridCopy);
            cell.collapsed = true;
            const pick = p.random(cell.options);
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
        }

    };


    return new p5(sketch, 'p5js')
}



function startOver() {
    // Create cell for each spot on the grid

    console.log('startOver')
    console.log(game.state)

    let {blockSize, DIM, blocks} = game.state 



    for (let i = 0; i < DIM * DIM*4; i++) {
        grid[i] = new Cell(tiles.length);
    }


    Object.values(blocks).forEach(o=>{

        let {position} = o 
        let {x,y,z} = position 
        let i = (x+2*DIM*blockSize/2)/blockSize - 0.5 
        let j = (y+2*DIM*blockSize/2)/blockSize - 0.5
        let k = (z+2*DIM*blockSize/2)/blockSize - 0.5 


        console.log(j)

        // if (j===0){
        grid[i + k * DIM].collapsed = true;
        grid[i + k * DIM].options = [0]

        grid[i + 1 + k * DIM].collapsed = true;
        grid[i + 1 + k * DIM].options = [0]

        grid[i + (k+1) * DIM].collapsed = true;
        grid[i + (k+1) * DIM].options = [0]

        grid[i + 1 + (k+1) * DIM].collapsed = true;
        grid[i + 1 + (k+1) * DIM].options = [0]
        // }

    })



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








/*

// Array for tiles and tile images
const tiles = [];
const tileImages = [];

// Current state of the grid
let grid = [];

// Width and height of each cell
const DIM = 25;

// Load images
function preload() {
  const path = "circuit";
  for (let i = 0; i < 13; i++) {
    tileImages[i] = loadImage(`${path}/${i}.png`);
  }
}

function setup() {
  createCanvas(400, 400);

  // Create and label the tiles
  tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"]);
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



function draw() {
  background(0);
  
  // Draw the grid
  const w = width / DIM;
  const h = height / DIM;
  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      let cell = grid[i + j * DIM];
      if (cell.collapsed) {
        let index = cell.options[0];
        image(tiles[index].img, i * w, j * h, w, h);
      } else {
        fill(0);
        stroke(100);
        rect(i * w, j * h, w, h);
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
}
*/