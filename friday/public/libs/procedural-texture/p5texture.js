console.log("p5texture.js");

var container;
var camera, scene, renderer, controls;
var map;
let planeMesh;
let myP5;
const tiles = [];
const tileImages = [];
let grid = [];
let animatedMesh = null;
let run = true;
let wfcDone = false;
let DIM = 40;
let SIZE = 50;

let wfcModifiers = [];


let tileData = []

function initP5js(scene) {

  console.log("initP5js");

  const geometry = new THREE.PlaneGeometry(DIM * SIZE, DIM * SIZE);
  geometry.rotateX(-Math.PI / 2);
  animatedMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'red'})); 
  // scene.add(animatedMesh)

  let name = "p5jsCanvas";

  let promise = new Promise((resolve) => {
    myP5 = initP5Canvas(name);
    setTimeout(() => resolve(myP5), 1);
  });

  promise.then(
    function (result) {

      console.log('p5 loaded!')

      myP5 = result

      displayP5(tileData)
      // let p5 = result
 /*     myP5 = result;
      let texture = new THREE.CanvasTexture(myP5.oCanvas);
      animatedMesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ map: texture })
      );
      animatedMesh.material.needsUpdate = true;
      scene.add(animatedMesh);
 */   },

    (error) => alert(error)
  );
}

function updateTexture(canvas, mesh) {
  let texture = new THREE.CanvasTexture(canvas);

  let material = new THREE.MeshBasicMaterial({
    map: texture,
    // opacity: 1,
    // transparent: true
  });
  mesh.material = material;

  return mesh;
}


function displayP5(data){


  myP5.display(data)


}

function initP5Canvas(name) {
  let sketch = function (p) {
    p.oCanvas;

    p.preload = function () {
      console.log("PRELOAD");
      const path = "libs/procedural-texture/circuit";
      for (let i = 0; i < 13; i++) {
        tileImages[i] = p.loadImage(`${path}/${i}.png`);
      }
    };

    p.setup = function () {
      console.log("create canvas");

      let cnv = p.createCanvas(512, 512);
      cnv.id(name);
      p.oCanvas = document.getElementById(name);
      p.background("purple");

      // p.drawRandom()
      // Create and label the tiles
      // tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"]); // a
      tiles[0] = new Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"]); // b
      tiles[1] = new Tile(tileImages[2], ["BBB", "BCB", "BBB", "BBB"]); // b,c
      tiles[2] = new Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"]); // b,d
      tiles[3] = new Tile(tileImages[4], ["ABB", "BCB", "BBA", "AAA"]); // a,b,c
      tiles[4] = new Tile(tileImages[5], ["ABB", "BBB", "BBB", "BBA"]);
      tiles[5] = new Tile(tileImages[6], ["BBB", "BCB", "BBB", "BCB"]);
      tiles[6] = new Tile(tileImages[7], ["BDB", "BCB", "BDB", "BCB"]);
      tiles[7] = new Tile(tileImages[8], ["BDB", "BBB", "BCB", "BBB"]);
      tiles[8] = new Tile(tileImages[9], ["BCB", "BCB", "BBB", "BCB"]);
      tiles[9] = new Tile(tileImages[10], ["BCB", "BCB", "BCB", "BCB"]);
      tiles[10] = new Tile(tileImages[11], ["BCB", "BCB", "BBB", "BBB"]);
      tiles[11] = new Tile(tileImages[12], ["BBB", "BCB", "BBB", "BCB"]);

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

 
    };

    p.display = function(data){

      p.background(34,155,215)





    }

/*  
  p.draw = function () {
      // let DIM = 20

      // step 1: check end condition
      if (wfcDone) return;

      // step 2: check modifiers
      wfcModifiers.forEach((o) => wfcModify(game.state, grid, o));
      wfcModifiers = [];

      // step 3: run wfc

      let gridCopy = grid.slice(); // Make a copy of grid
      gridCopy = gridCopy.filter((a) => !a.collapsed); // Remove any collapsed cells

      if (gridCopy.length == 0) {
        // The algorithm has completed if everything is collapsed
        wfcDone = true;
        return;
      }

      // grid = wfc({ grid, gridCopy, p, DIM });

      // step 4: draw tiles
      drawTiles(p, DIM);
    };
    */
  };

  return new p5(sketch, "p5js");
}
/*
function wfcModify(state, grid, o) {
  console.log("modify");
  clearSquare(state, o, 3, grid);
  placeBlockCells(game.state, Object.values(game.state.blocks));
}

function clearSquare(state, center, off, grid) {
  console.log("clear ");

  let { blockSize, DIM, blocks } = state;
  let { i, j, k } = getCoordinates(state, center);

  for (var t = -off; t < off; t++) {
    for (var u = -off; u < off; u++) {
      let row = i + t;
      let col = k + u;

      if (row < 0) continue;
      if (row >= DIM) continue;
      if (col < 0) continue;
      if (col >= DIM) continue;

      let index = i + t + (k + u) * DIM;

      // let cell = grid[index]

      if (grid[index] == undefined) {
        console.log("undefined at", row, col);
      }

      grid[index] = new Cell(tiles.length);

      // grid[index].options = [0, 1, 2, 3, 4, 5]
    }
  }

  return grid;
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

function startOver() {
  let { blockSize, DIM, blocks } = game.state;

  grid = [];

  for (let i = 0; i < DIM * DIM; i++) {
    grid[i] = new Cell(tiles.length);
  }

  placeBlockCells(game.state, Object.values(blocks));
}

function placeBlockCells(state, arr) {
  console.log("place block cells");

  let { blockSize, DIM, blocks } = state;

  arr.forEach((o) => {
    // console.log(o)

    let { i, j, k } = getCoordinates(state, o);
    grid[i + k * DIM].collapsed = true;
    grid[i + k * DIM].options = [0, 1, 4];
  });
}

function drawTiles(p5, DIM) {
  const w = p5.width / DIM;
  const h = p5.height / DIM;

  if (grid === undefined) {
    console.log("grid is undefined!");
    startOver();
  }

  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      let row = i;
      let col = j;

      if (row < 0) continue;
      if (row >= DIM) continue;
      if (col < 0) continue;
      if (col >= DIM) continue;

      let cell = grid[i + j * DIM];

      if (cell.collapsed) {
        let index = cell.options[0];
        if (index === undefined) index = 0;
        p5.image(tiles[index].img, i * w, j * h, w, h);
      } else {
        p5.fill("purple");
        p5.stroke(100);
        p5.rect(i * w, j * h, w, h);
      }
    }
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

function wfc({ grid, gridCopy, p, DIM }) {
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
  const cell = p.random(gridCopy);
  cell.collapsed = true;
  const pick = p.random(cell.options);
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
*/