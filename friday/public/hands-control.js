// sketch.js
// aka the client side:
// - use handpose to track hand skeleton
// - send to server via socket.io
// - update display with other users' hands from server

/* global describe handpose tf io THREE*/

// var socket = io(); // the networking library

let handposeModel = null; // this will be loaded with the handpose model

let videoDataLoaded = false; // is webcam capture ready?

let statusText = "Loading handpose model...";

let myHands = []; // hands detected in this browser
// currently handpose only supports single hand, so this will be either empty or singleton

let handMeshes = {}; // these are threejs objects that makes up the rendering of the hands
// stored as { userId : Array<Object3D> }

let handCollection = new THREE.Object3D();

const cameraOffset = new Vector3(0, 1000.0, 1000.0); // NOTE Constant offset between the camera and the target

let handsImage = new Image();
handsImage.src = "assets/images/hands.png";

// html canvas for drawing debug view
let dbg = document.createElement("canvas").getContext("2d");
dbg.canvas.style.position = "absolute";
dbg.canvas.style.left = "0px";
dbg.canvas.style.top = "0px";
dbg.canvas.style.zIndex = 100; // "bring to front"
dbg.canvas.id = "dbg-canvas";

// dbg.drawImage(handsImage, 100, 100);

document.body.appendChild(dbg.canvas);

if (enableHandTracking) {
}

const videoConstraints = {
  width: { min: 420, ideal: 480, max: 1080 },
  height: { min: 420, ideal: 480, max: 1080 },
};

// read video from webcam

if (enableHandTracking) {
  var capture = document.createElement("video");
  capture.playsinline = "playsinline";
  capture.autoplay = "autoplay";
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: videoConstraints })
    .then(function (stream) {
      window.stream = stream;
      capture.srcObject = stream;
    });

  // hide the video element
  capture.style.position = "absolute";
  capture.style.opacity = 0;
  capture.style.zIndex = -100; // "send to back"

  // signal when capture is ready and set size for debug canvas
  capture.onloadeddata = function () {
    console.log("video initialized");
    videoDataLoaded = true;
    dbg.canvas.width = capture.videoWidth; // half size
    dbg.canvas.height = capture.videoHeight;
    dbg.canvas.style.transform = "scale(-1, 1)";

    game.camera.position.z = capture.videoWidth / 2; // rough estimate for suitable camera distance based on FOV
  };
}

// certian materials require a light source, which you can add here:
// var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
// scene.add( directionalLight );

// update threejs object position and orientation according to data sent from server
// threejs has a "scene" model, so we don't have to specify what to draw each frame,
// instead we put objects at right positions and threejs renders them all
function updateMeshesFromServerData(remoteData, game) {
  // console.log('updateMeshesFromServerData:: ', remoteData, game)
  // first, we add the newly appeared hands from the server
  for (const data of remoteData) {
    // console.log('Remote data hands:: ', data.hands)
    if (!data.hands) continue;
    if (!handMeshes[data.id] && data.hands.length) {
      handMeshes[data.id] = new THREE.Object3D();

      if(data.id === game.player.id) handMeshes[data.id].localPlayer = true

      for (var i = 0; i < 21; i++) {
        // 21 keypoints
        var { isPalm, next } = getLandmarkProperty(i);

        var obj = new THREE.Object3D(); // a parent object to facilitate rotation/scaling

        // we make each bone a cylindrical shape, but you can use your own models here too
        var geometry = new THREE.CylinderGeometry(isPalm ? 5 : 10, 5, 1);

        var material = new THREE.MeshNormalMaterial();
        // another possible material (after adding a light source):
        // var material = new THREE.MeshPhongMaterial({color:0x00ffff});

        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;

        obj.add(mesh);
        // console.log('Made a hand:: ', obj)
        handMeshes[data.id].add(obj);
      }
      handCollection.add(handMeshes[data.id]);
      // game.scene.add(handMeshes[data.id]);
      game.scene.add(handCollection);
    }
  }
  // next, we remove the hands that are already gone in the server
  for (var id in handMeshes) {
    const data = remoteData.find((d) => d.id === id);
    if (!data || !data.hands.length) {
      if (handMeshes[id].children?.length)
        handMeshes[id].remove(...handMeshes[id].children);
      /* for (var i = 0; i < handMeshes[id].length; i++){
      } */
      delete handMeshes[id];
    }
  }
  // you can potentially change the above logic to something a bit smarter:
  // - don't remove a hand as soon as it disappears, instead give it a chance and wait couple more
  //   frames and see if it comes back
  // - if one user is gone but another just came in, instead of removing a bunch of meshes and adding
  //   a bunch again, recycle by reassigning the meshes

  // move the meshes and orient them
  for (var id in handMeshes) {
    handCollection.rotation.x = 0;
    handCollection.rotation.z = 0;
    handCollection.position.set(0,0,0)
    // handCollection.rotation.z = 0
    const data = remoteData.find((d) => d.id === id);
    if (!data || !data.hands.length) {
      // we checked this before, doing it again in case we modify previous logic
      continue;
    }

    const averageHandPosition = new THREE.Vector3();

    for (var i = 0; i < handMeshes[id].children.length; i++) {
      var { isPalm, next } = getLandmarkProperty(i);

      var p0 = webcam2space(...data.hands[0].landmarks[i]); // one end of the bone
      var p1 = webcam2space(...data.hands[0].landmarks[next]); // the other end of the bone

      // compute the center of the bone (midpoint)
      var mid = p0.clone().lerp(p1, 0.5);
      //   mid.add(data.position)
      //   const position = data.position
      handMeshes[id].children[i].position.set(mid.x, mid.y, mid.z);

      // compute the length of the bone
      handMeshes[id].children[i].scale.z = p0.distanceTo(p1);

      // compute orientation of the bone
      handMeshes[id].children[i].lookAt(p1);
      // handMeshes[id][i].lookAt(data.position);

      //   handMeshes[id].children[i].position.add(data.position)

      if (id === game.player.id) {
        averageHandPosition.add(handMeshes[id].children[i].position);
      }
    }

    handCollection.rotation.x = Math.PI / 2;
    handCollection.rotation.z = Math.PI;
    if(id === game.player.id) {

      averageHandPosition.multiplyScalar(1 / 21);
      averageHandPosition.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      averageHandPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      handCollection.position.set(averageHandPosition.x*1.25, 0, averageHandPosition.z*1.25)
      averageHandPosition.x *=2.25
      averageHandPosition.z *=2.25
      game.handMovementCallback(averageHandPosition);

      // game.camera.position.copy(averageHandPosition).add(cameraOffset)
      game.camera.position.lerp(averageHandPosition.clone().add(cameraOffset), 0.01)

      const lookAt = new THREE.Vector3( 0, 0, -1 );
      lookAt.applyQuaternion( game.camera.quaternion )
      game.camera.lookAt(lookAt.lerp(averageHandPosition, 0.01))
    }
  }
}

// Load the MediaPipe handpose model assets.
handpose.load().then(function (_model) {
  console.log("model initialized.");
  statusText = "Model loaded.";
  handposeModel = _model;
});

/* // tell the server we're ready!
game.player.socket.emit('client-start')

// update our data everytime the server sends us an update
game.player.socket.on('server-update', function(data){
  serverData = data;
  updateMeshesFromServerData();
}) */

// compute some metadata given a landmark index
// - is the landmark a palm keypoint or a finger keypoint?
// - what's the next landmark to connect to if we're drawing a bone?
function getLandmarkProperty(i) {
  var palms = [0, 1, 2, 5, 9, 13, 17]; //landmark indices that represent the palm

  var idx = palms.indexOf(i);
  var isPalm = idx != -1;
  var next; // who to connect with?
  if (!isPalm) {
    // connect with previous finger landmark if it's a finger landmark
    next = i - 1;
  } else {
    // connect with next palm landmark if it's a palm landmark
    next = palms[(idx + 1) % palms.length];
  }
  return { isPalm, next };
}

// draw a hand object (2D debug view) returned by handpose
function drawHands(hands, noKeypoints) {
  // console.log('drawHands:: ', hands)

  // Each hand object contains a `landmarks` property,
  // which is an array of 21 3-D landmarks.
  for (var i = 0; i < hands.length; i++) {
    var landmarks = hands[i].landmarks;

    var palms = [0, 1, 2, 5, 9, 13, 17]; //landmark indices that represent the palm

    for (var j = 0; j < landmarks.length; j++) {
      var [x, y, z] = landmarks[j]; // coordinate in 3D space

      // draw the keypoint and number
      if (!noKeypoints) {
        dbg.fillRect(x - 2, y - 2, 4, 4);
        dbg.fillText(j, x, y);
      }

      // draw the skeleton
      var { isPalm, next } = getLandmarkProperty(j);
      dbg.beginPath();
      dbg.moveTo(x, y);
      dbg.lineTo(...landmarks[next]);
      dbg.stroke();
    }
  }
}

// hash to a unique color for each user ID
function uuid2color(uuid) {
  var col = 1;
  for (var i = 0; i < uuid.length; i++) {
    var cc = uuid.charCodeAt(i);
    col = (col * cc) % 0xffffff;
  }
  return [(col >> 16) & 0xff, (col >> 8) & 0xff, col & 0xff];
}

// transform webcam coordinates to threejs 3d coordinates
function webcam2space(x, y, z) {
  return new THREE.Vector3(
    2 * (x - capture.videoWidth / 2),
    -2 * (y - capture.videoHeight / 2), // in threejs, +y is up
    -2 * z
  );
}
