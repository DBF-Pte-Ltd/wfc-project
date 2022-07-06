// Wave Function Collapse (tiled model)
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/challenges/171-wave-function-collapse
// https://youtu.be/0zac-cDzJwA

// Code from Challenge: https://editor.p5js.org/codingtrain/sketches/pLW3_PNDM
// Corrected and Expanded: https://github.com/CodingTrain/Wave-Function-Collapse


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

// Tile class
class Tile {
  constructor(img, edges) {
    // Image
    this.img = img;
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
  rotate(num) {
    // Draw new tile
    const w = this.img.width;
    const h = this.img.height;
    const newImg = createGraphics(w, h);
    newImg.imageMode(CENTER);
    newImg.translate(w / 2, h / 2);
    newImg.rotate(HALF_PI * num);
    newImg.image(this.img, 0, 0);
  
    // Rotate edges
    const newEdges = [];
    const len = this.edges.length;
    for (let i = 0; i < len; i++) {
      newEdges[i] = this.edges[(i - num + len) % len];
    }
    return new Tile(newImg, newEdges);
  }
}
