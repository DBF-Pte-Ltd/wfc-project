console.log('script')

var container;

var camera, scene, renderer, controls;
var map
let planeMesh
let myP5


initThreeJS() // init threeJS div
initP5js()
animate();



function initP5js() {



    let name = 'p5jsCanvas'

    let promise = new Promise(resolve => {

        myP5 = initP5Canvas(name)
        setTimeout(() => resolve(myP5), 1000)

    });

    promise.then(function(result) {

            // console.log('myP5 initialized')


            let p5 = result

            const geometry = new THREE.PlaneGeometry(183, 183, 1);
            planeMesh = new THREE.Mesh(geometry)
            scene.add(planeMesh);

            updateTexture(p5.oCanvas,planeMesh) 

        },

        error => alert(error)

    )



}





function updateTexture(canvas, mesh) {


    let texture = new THREE.CanvasTexture(canvas)

    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    let material = new THREE.MeshBasicMaterial({
        map: texture,
        opacity: 1,
        transparent: true
    });
    mesh.material = material

    return mesh 

}




function initP5Canvas(name) {



    let sketch = function(p) {

        p.oCanvas
        p.setup = function() {

            let cnv = p.createCanvas(512, 512)
            cnv.id(name);
            p.oCanvas = document.getElementById(name)
            // p.background(0)

            p.drawRandom()

        }

        p.drawRandom = function() {

            for (var i = 0; i < 100; i++) {

                p.fill(p.random(255), p.random(255), p.random(255))
                p.circle(p.random(p.width), p.random(p.height), 25)

            }

        }

        p.draw = function (x,y){




        }
    };


    return new p5(sketch, 'p5js')
}





function initThreeJS() {
    var container = document.getElementById('threeJS');

    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(renderer.domElement)

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x222222);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(0, 0, 100);
    // camera.lookAt(0,0,0)

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 20000;

    scene.add(new THREE.AmbientLight(0x222222));

    var light = new THREE.PointLight(0xffffff);
    light.position.copy(camera.position);
    scene.add(light)

}

function animate() {

    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}




function cloneCanvas(oldCanvas) {

    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    //return the new canvas
    return newCanvas;
}

// mapbox tile is 512x512 pixels, here is a guide to Zoom levels and geographical distance
// go to this web page https://docs.mapbox.com/help/glossary/zoom-level/#zoom-levels-and-geographical-distance
// it's tricky this way because depends on the latitute for an aproximate distance 
// the mapbox tile is 512X512 pixels, and I fixed this map, to be at a zoom level = 15, which for this city means that the pixel will be 1.83meters / pixel

function createPlane() {

    let k = (window.innerWidth / 2) / window.innerHeight
        // let k = 512
        // geometry = new THREE.PlaneBufferGeometry(window.innerWidth/2,window.innerHeight/2,10);
        // <<<<<<< HEAD
    const geometry = new THREE.PlaneGeometry(183, 183, 1);
    // const geometry = new THREE.PlaneGeometry(936.96, 936.96, 1);
    // =======
    //     // const geometry = new THREE.PlaneGeometry(183*k, 183 *k, 1);
    //     const geometry = new THREE.PlaneGeometry(936.96, 936.96, 1);
    // >>>>>>> aac4b18eb6d33707ad6590c5ae3e896550af2218

    planeMesh = new THREE.Mesh(geometry);
    planeMesh.rotation.x = -Math.PI / 4
        // planeMesh.rotation.set(new THREE.Vector3( 0, Math.PI / 2,0));

    console.log('add plane')

    scene.add(planeMesh);

    updateTexture(planeMesh)

}




function getMousePosition() {

    const pos = {}

    let screen_posX = event.clientX 
    let screen_posY = event.clientY

    pos.x = ((screen_posX - renderer.domElement.offsetLeft) / window.innerWidth) * 2 - 1
    pos.y = -((screen_posY - renderer.domElement.offsetTop) / window.innerHeight) * 2 + 1

    return pos

}


$(document).mousemove(function(e) {

    // myP5.paint()

    // if(!paintmode) {return}
    // if (e.target.nodeName != "CANVAS") {return;}

    // const pos = raycast()
    // if(pos) {
    //     p.paint(pos.x+250, pos.z+250)
    //     console.log('p.oCanvas:: ', p.oCanvas)
    //     plane.material.map = new THREE.CanvasTexture(p.oCanvas)
    //     plane.material.needsUpdate = true
    // }

})


