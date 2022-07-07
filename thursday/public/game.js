let enableHandTracking = true 

class Game {
    constructor() {
        if (!Detector.webgl) Detector.addGetWebGLMessage();

        this.container;
        this.player;
        this.stats;
        this.controls;
        this.camera;
        this.scene;
        this.renderer;

        this.remotePlayers = [];
        this.initialisingPlayers = [];
        this.remoteData = [];

        this.objects = [];

        this.voxels = {}

        this.handElevations = [200, 200, 200, 200, 200]

        this.container = document.createElement("div");
        this.container.style.height = "100%";
        document.body.appendChild(this.container);

        const game = this;

        this.assetsPath = "./assets/";

        this.clock = new THREE.Clock();

        this.animationQueue = []


        this.init();

        window.onError = function(error) {
            console.error(JSON.stringify(error));
        };
    }

    restoreState(state) {
        let { DIM, blocks } = state;

        this.state = state;

        // grid
        const gridHelper = new THREE.GridHelper(DIM * 50, DIM);
        this.scene.add(gridHelper);

        //raycaster and pointer
        this.raycaster = new THREE.Raycaster();
        this.down = new THREE.Vector3(0, -1, 0);
        this.up = new THREE.Vector3(0, 1, 0);

        this.pointer = new THREE.Vector2();

        //shift press handler
        this.isCrtlDown = false;

        const geometry = new THREE.PlaneGeometry(DIM * 50, DIM * 50);
        geometry.rotateX(-Math.PI / 2);
        this.plane = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ visible: false })
        );

        this.objects.push(this.plane);
        // this.scene.add(game.plane);

        Object.values(blocks).forEach((o) => this.update("add", o));
        initP5js(this.scene);
    }

    update(key, value) {
        switch (key) {
            case "add":
                // console.log('Game update: ', key, value)
                const remoteCubeMat = new THREE.MeshLambertMaterial({
                    // color: value.color,
                });
                const voxel = new THREE.Mesh(game.player.cubeGeo, remoteCubeMat);
                voxel.position.copy(value.position);
                voxel.uuid = value.uuid;
                game.scene.add(voxel);
                game.objects.push(voxel);
                // game.voxels[ voxel.uuid ] = voxel 
                game.animationQueue.push({ object: voxel, duration: 24 })

                this.updateTextures()
                break;

            case "remove":
                const objectIndex = game.objects.findIndex(
                    (o) => o.uuid === value.uuid
                );
                // console.log('Game update: ', key, value, objectIndex)
                if (objectIndex > -1) {
                    game.scene.remove(game.objects[objectIndex]);
                    game.objects.splice(objectIndex, 1);
                }
                break;
                /* case 'highlight':
                            console.log('Update highlight:: ', value)
                            game.remotePlayers[value.uuid].rollOverMesh.position.copy(value.position)
                            break; */
            default:
                break;
        }
    }

    intializeTextures() {


        let object = {}


        let category = ['commercial', 'industrial', 'institutional', 'office', 'parking', 'recreational', 'residential']
        let values = ['1-20', '1-30', '1-50', '1-60', '1-80', '1-90']


        for (let i = 0; i < category.length; i++) {

            let str1 = category[i]

            object[str1] = {}

            for (let j = 0; j < values.length; j++) {


                let str2 = values[j]
                let path = 'assets/facades/' + str1 + '/' + str2 + '.jpg'

                object[str1][str2] = new THREE.TextureLoader().load(path)


            }
        }

        return object

    }


    updateTextures() {

        this.objects.forEach(o => {

                if (o.material.map) return
                let category = ['commercial', 'industrial', 'institutional', 'office', 'parking', 'recreational', 'residential']
                let values = ['1-20', '1-30', '1-50', '1-60', '1-80', '1-90']
                let str1 = category[Math.floor(Math.random() * category.length)]
                let str2 = values[Math.floor(Math.random() * values.length)]
                o.material.map = this.textures[str1][str2]
            }

        )

    }

    init() {



        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            10,
            20000
        );

        this.textures = this.intializeTextures()
        this.camera.position.set(500, 400, -500);
        this.scene = new THREE.Scene();

        let ambient = new THREE.AmbientLight(0xa0a0a0);

        let light = new THREE.HemisphereLight(0xdddddd, 0x444444);
        light.position.set(0, 200, 0);
        this.scene.add(light);

        // model

        const game = this;

        this.player = new PlayerLocal(this);
        console.log(this.player);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(
            this.camera,
            this.renderer.domElementgeo
        );
        this.controls.target.set(0, 150, 0);
        this.controls.update();

        window.addEventListener(
            "resize",
            function() {
                game.onWindowResize();
            },
            false
        );
        document.addEventListener("pointermove", game.onPointerMove);
        document.addEventListener("pointerdown", game.onPointerDown);
        document.addEventListener("keydown", game.onDocumentKeyDown);
        document.addEventListener("keyup", game.onDocumentKeyUp);

        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateRemotePlayers() {


        if (this.remoteData === undefined || this.remoteData.length == 0 || this.player === undefined || this.player.id === undefined) return;

        const newPlayers = [];
        const game = this;
        //Get all remotePlayers from remoteData array
        const remotePlayers = [];


        let {pack, changes} = this.remoteData


        changes.forEach(changed =>{


            console.log('changed object!')

            let {shape} = changed 
            const index = game.objects.findIndex((o) => o.uuid === changed.uuid);
            game.objects[index].geometry = new THREE.CylinderGeometry(25,50,50)
            // game.player.cubeGeo
        
        })






        pack.forEach(function(data) {
            if (game.player.id != data.id) {
                //Is this player being initialised?
                let iplayer;
                game.initialisingPlayers.forEach(function(player) {
                    if (player.id == data.id) iplayer = player;
                });
                //If not being initialised check the remotePlayers array
                if (iplayer === undefined) {
                    let rplayer;
                    game.remotePlayers.forEach(function(player) {
                        // console.log('Player:: ', player)
                        if (player?.id == data.id) rplayer = player;
                    });

                    if (rplayer === undefined) {
                        //Initialise player
                        // game.initialisingPlayers.push( new Player( game, data ));
                        remotePlayers.push(new Player(game, data));
                        // console.log('Remote players:: ', {remote: game.remotePlayers, toInit: game.initialisingPlayers})
                    } else {
                        //Player exists
                        remotePlayers.push(rplayer);
                    }
                }
            }
        });

        /* this.scene.children.forEach( function(object){
              if (object.userData.remotePlayer && game.getRemotePlayerById(object.userData.id)==undefined){
                game.scene.remove(object);
              } 
            }); */

        this.remotePlayers = remotePlayers;
        this.remotePlayers.forEach(function(player) {
            player.update();
        });
        //update hand meshes based on remote data - function in hands-controls.js
        updateMeshesFromServerData(pack, this);
    }

    animate() {
        const game = this;
        const dt = this.clock.getDelta();

                if (animatedMesh) {
                    animatedMesh.material.map.dispose();
                    animatedMesh.material.map = new THREE.CanvasTexture(myP5.oCanvas);
                    animatedMesh.material.needsUpdate = true;
                }

        const animationQueue = []

        game.animationQueue.forEach(anim => {
            anim.object.scale.x = Math.sin(Math.PI * (90 / (12 - anim.duration)) / 180) + 1
            anim.object.scale.z = Math.sin(Math.PI * (90 / (12 - anim.duration)) / 180) + 1
            anim.duration--

            if (anim.duration) animationQueue.push(anim)
            else {
                anim.object.scale.x = 1
                anim.object.scale.z = 1
            }
        })

        game.animationQueue = animationQueue

        requestAnimationFrame(function() {
            game.animate();
        });
        this.updateRemotePlayers(dt);

        if (enableHandTracking) {

            if (handposeModel && videoDataLoaded) {
                // model and video both loaded
                handposeModel.estimateHands(capture).then(function(_hands) {
                    // we're handling an async promise
                    // best to avoid drawing something here! it might produce weird results due to racing
                    myHands = _hands; // update the global myHands object with the detected hands
                    if (!myHands.length) {
                        // haven't found any hands
                        statusText = "Show some hands!";
                    } else {
                        // display the confidence, to 3 decimal places
                        statusText =
                            "Confidence: " +
                            Math.round(myHands[0].handInViewConfidence * 1000) / 1000;
                    }

                    // tell the server about our updates!
                    game.player.hands = myHands;
                    if (game.player.hands[0]) {

                        /*  const pt1 = new THREE.Vector3(...game.player.hands[0].landmarks[0])
                         const pt2 = new THREE.Vector3(...game.player.hands[0].landmarks[1])
                         const dist = 50 + 10000/pt1.distanceTo(pt2) */
                        // console.log('Landmarks:: ', dist)

                        let avgHandPos = AVERAGE(game.handElevations)
                        if(avgHandPos>1500) avgHandPos = 1500

                        game.player.hands[0].landmarks.forEach((l) => (l[2] += avgHandPos));
                    }
                    game.player.updateSocket();
                });
            }

            //draw on 2D canvas for hands
            dbg.clearRect(0, 0, dbg.canvas.width, dbg.canvas.height);
            dbg.save();
            dbg.fillStyle = "red";
            dbg.strokeStyle = "red";
            //   dbg.drawImage(capture,0,0);
            drawHands(myHands);
            dbg.restore();
            dbg.save();
            dbg.fillStyle = "red";
            //   dbg.fillText(statusText,2,60);
            dbg.restore();
        }


        this.renderer.render(this.scene, this.camera);
    }

    onPointerMove(event) {
        // console.log('Running onPointerMove.')

        game.pointer.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        game.raycaster.setFromCamera(game.pointer, game.camera);
        const intersects = game.raycaster.intersectObjects(game.objects, false);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            game.player.rollOverMesh.position
                .copy(intersect.point)
                .add(intersect.face.normal);
            game.player.rollOverMesh.position
                .divideScalar(50)
                .floor()
                .multiplyScalar(50)
                .addScalar(25);
            // console.log('Update socket:: ', game.player.updateSocket)
            game.player.position = game.player.rollOverMesh.position;
            game.player.updateSocket();
            // game.player.socket.emit("update", { uuid: game.player.id, position: game.player.rollOverMesh.position, color: game.player.color });
        }
    }

    onPointerDown(event) {
        game.pointer.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        game.raycaster.setFromCamera(game.pointer, game.camera);
        const intersects = game.raycaster.intersectObjects(game.objects, false);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            // delete cube
            if (game.isCrtlDown) {

                if (intersect.object !== game.plane) {
                    game.scene.remove(intersect.object);
                    game.objects.splice(game.objects.indexOf(intersect.object), 1);
                    game.player.socket.emit("remove", { uuid: intersect.object.uuid });
                }

                // create cube
            } else {


                console.log('add voxel')


                let position = new THREE.Vector3()
                position.copy(intersect.point).add(intersect.face.normal);
                position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

                let uuid = generateUUID()
                let color = game.player.color

                let params = { position, color, uuid }

                game.state['blocks'][uuid] = params // need to update local state 
                game.update("add", params) // update local 
                game.player.socket.emit("add", params); // update global


                console.log('add modifier')
                wfcModifiers.push(params) // event loop wfc 
                wfcDone = false

            }
        }
    }

    onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case 17:
                game.isCrtlDown = true;
                break;
        }
    }

    onDocumentKeyUp(event) {
        switch (event.keyCode) {
            case 17:
                game.isCrtlDown = false;
                break;
        }
    }

    handMovementCallback(position) {
        console.log('Executing handMovementCallback!')
        //do things when hand moves

        position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        this.player.rollOverMesh.position.copy(position);

        this.raycaster.set(position, this.up);
        const intersectsAbove = this.raycaster.intersectObjects(this.objects, false);
        if(intersectsAbove.length) {
          const upmost = intersectsAbove.pop()
          game.handElevations.push(upmost.point.y + 50)
        }
        else {
          game.handElevations.push(200)
        }
        game.handElevations.shift()


        this.raycaster.set(position, this.down);
        const intersects = this.raycaster.intersectObjects(this.objects, false);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            // delete cube
            if (this.isCrtlDown) {
                if (intersect.object !== this.plane) {
                    this.scene.remove(intersect.object);
                    this.objects.splice(this.objects.indexOf(intersect.object), 1);
                    this.player.socket.emit("remove", { uuid: intersect.object.uuid });
                }
                // create cube
            } else {
                let position = new THREE.Vector3();
                position.copy(intersect.point).add(intersect.face.normal);
                position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

                for(const object of game.objects) {
                  // console.log('Positions:: ', position, object.position)
                  if(position.equals(object.position)) {
                    console.log('Already exists!')
                    return;
                  }
                }

                let uuid = generateUUID();
                let color = this.player.color;

                this.update("add", { position, color, uuid }); // update local
                this.player.socket.emit("add", { position, color, uuid }); // update global

                let params = { position, color, uuid }

                console.log('add modifier')
                wfcModifiers.push(params) // event loop wfc 
                wfcDone = false
            }
        }
    }
}