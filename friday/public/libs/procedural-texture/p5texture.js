console.log("p5texture.js");

var container;
var camera, scene, renderer, controls;
var map;
let planeMesh;
let myP5;
const tiles = [];
// const tileImages = [];
let grid = [];
let animatedMesh = null;
let run = true;
let wfcDone = false;
let DIM = 40;
let SIZE = 50;
let wfcModifiers = [];
let tileData = []
let tileImages = []

let wtfCanvas = initCanvas(DIM * SIZE, DIM * SIZE)

let initP5js = async function(scene) {

    const geometry = new THREE.PlaneGeometry(DIM * 50, DIM * 50);
    geometry.rotateX(-Math.PI / 2);
    animatedMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    animatedMesh.material.needsUpdate = true;

    scene.add(animatedMesh)



    let promise = new Promise(resolve => {


      const path = "libs/procedural-texture/circuit";


      resolve(loadImageArray(path))
      // setTimeout(() => resolve(null), 1000)


    });

    promise.then(function(result) {
      // console.log('images loaded', tileImages)
 
    }, error => alert(error))

};

const loadImageArray = async(path)=>{

    for (let i = 1; i < 13; i++) {
        tileImages[i-1] = await loadImage(`${path}/${i}.png`)
    }

}


const loadImage = async (src) => {

    const image = new Image(100, 100); // Using optional size for image
    image.src = src;

image.onload = function() {

  // console.log('im loaded')
}
    return image

};


function drawTexture(data) {

    // console.log('draw texture')
    // console.log(data)

    let canvas = wtfCanvas

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let { grid } = data


    const w = SIZE
    const h = SIZE


    for (let j = 0; j < DIM; j++) {

        for (let i = 0; i < DIM; i++) {


            let row = i
            let col = j

            if (row < 0) continue
            if (row >= DIM) continue
            if (col < 0) continue
            if (col >= DIM) continue


            let cell = grid[i + j * DIM];

            if (cell === undefined) continue 

            if (cell.collapsed) {

                let index = cell.options[0];

                if (index === undefined) index = 0  
                  // console.log('index',index)
                let img = tileImages[index]      
                ctx.drawImage(img, i * w, j * h, w, h);

            } else {

                // p5.fill('purple');
                // p5.stroke(100);
                // p5.rect(i * w, j * h, w, h);

            }
        }
    }

}



function initCanvas(width, height) {

    let canvas = document.createElement('canvas');
    canvas.width = width
    canvas.height = height

    let context = canvas.getContext('2d');
    context.fillStyle = '#ff00ff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    return canvas
}

// function drawRotated(ctx, degrees) {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.save();
//     ctx.translate(canvas.width / 2, canvas.height / 2);
//     ctx.rotate(degrees * Math.PI / 180);
//     ctx.drawImage(image, -image.width / 2, -image.width / 2);
//     ctx.restore();
// }



function drawRotated(degrees) {

    var canvas = document.getElementById("p5js");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(image, -image.width / 2, -image.width / 2);
    ctx.restore();
    return
}