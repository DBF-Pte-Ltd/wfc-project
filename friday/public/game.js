let enableHandTracking = true;
let runWFC = false;

var stats = Stats()
document.body.appendChild(stats.dom)

const voxelMat = new THREE.MeshBasicMaterial({
    visible: false,
});

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

        this.voxels = {};

        this.handElevations = [200, 200, 200, 200, 200];

        this.container = document.createElement("div");
        this.container.style.height = "100%";
        document.body.appendChild(this.container);

        const game = this;

        this.assetsPath = "./assets/";

        this.clock = new THREE.Clock();

        this.animationQueue = [];

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
                const remoteCubeMat = new THREE.MeshLambertMaterial({
                    // color: value.color,
                });
                const voxel = new THREE.Mesh(game.player.cubeGeo, voxelMat);
                voxel.uuid = value.uuid;
                voxel.position.copy(value.position);

                const block = new THREE.Mesh(game.player.cubeGeo, remoteCubeMat);
                block.position.copy(value.position);
                block.uuid = value.uuid;
                game.scene.add(block, voxel);
                game.objects.push(block);
                game.voxels[voxel.uuid] = voxel;
                game.animationQueue.push({ object: block, duration: 24 });

                // this.updateTextures();
                break;

            case "remove":
                // console.log("Got remove request from remote.");
                const blockIndex = game.objects.findIndex((o) => o.uuid === value.uuid);
                if (blockIndex > -1) {
                    const block = game.objects[blockIndex];
                    game.scene.remove(block);
                    game.objects.splice(blockIndex, 1);

                    const voxel = game.voxels[block.uuid];
                    if (voxel) {
                        // console.log("Found its voxel.");
                        game.scene.remove(voxel);
                        delete game.voxels[block.uuid];
                    }
                }
                break;
            default:
                break;
        }
    }

    intializeTextures() {
        let object = {};

        let category = [
            "commercial",
            "industrial",
            "institutional",
            "office",
            "parking",
            "recreational",
            "residential",
        ];
        let values = ["1-20", "1-30", "1-50", "1-60", "1-80", "1-90"];

        for (let i = 0; i < category.length; i++) {
            let str1 = category[i];

            object[str1] = {};

            for (let j = 0; j < values.length; j++) {
                let str2 = values[j];
                let path = "assets/facades/" + str1 + "/" + str2 + ".jpg";

                object[str1][str2] = new THREE.TextureLoader().load(path);
            }
        }

        return object;
    }

    updateMap(a, b, o) {

        if(!o) return;

 /*       object.category = category
        object.variation = variation

        console.log(category, variation)
        console.log('texture:',this.textures[category][variation] )
        object.material.map = this.textures[category][variation];*/


        // let category = ['commercial', 'industrial', 'institutional', 'office', 'parking', 'recreational', 'residential']
        // let values = ['1-20', '1-30', '1-50', '1-60', '1-80', '1-90']
        // let str1 = category[Math.floor(Math.random() * category.length)]
        // let str2 = values[Math.floor(Math.random() * values.length)]
        o.material.map = this.textures[a][b]
        o.material.needsUpdate = true 

        // console.log('update textures')

        // this.updateTextures()
        
    }

    updateTileset(data){

      console.log('game - update tileset')


      // // initP5js(this.scene);

      // displayP5(data)

      // console.log(animatedMesh)
      // // animatedMesh.material.map.dispose();
      // animatedMesh.material.map = new THREE.CanvasTexture(myP5.oCanvas);
      // animatedMesh.material.needsUpdate = true;
 
    }

    updateTextures() {

        this.objects.forEach(o => {

                if (o.material.map) return
                let category = ['commercial', 'industrial', 'institutional', 'office', 'parking', 'recreational', 'residential']
                let values = ['1-20', '1-30', '1-50', '1-60', '1-80', '1-90']
                let str1 = category[Math.floor(Math.random() * category.length)]
                let str2 = values[Math.floor(Math.random() * values.length)]
                o.material.map = this.textures[str1][str2]
                o.material.needsUpdate = true 
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

        this.textures = this.intializeTextures();
        this.camera.position.set(0, 3000, -4000);
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
        this.controls.enabled = false;
        this.controls.autoRotate = true;
        /* this.controls.minPolarAngle = Math.PI / 6;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minAzimuthAngle = -Math.PI / 2;
        this.controls.maxAzimuthAngle = Math.PI / 2; */

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
        if (
            this.remoteData === undefined ||
            this.remoteData.length == 0 ||
            this.player === undefined ||
            this.player.id === undefined
        )
            return;


        const newPlayers = [];
        const game = this;
        const remotePlayers = [];

        let { pack, changes } = this.remoteData;

        if (changes.length > 0) console.log('replace');

        changes.forEach((changed) => {

            const index = game.objects.findIndex((o) => o.uuid === changed.uuid);
            let block = game.objects[index]

            if(!block) {return;}

            if (changed.hasOwnProperty('shape')) {

                let { shape } = changed;
                if (shape === 'cylinder') {
                    block.geometry = new THREE.CylinderGeometry(15, 25, 50);
                } else {
                    block.geometry = new THREE.BoxGeometry(50, 50, 50);
                }

            }


            if (changed.hasOwnProperty('category')) {

                console.log('update texture!')
                let { category, variation } = changed
                console.log('update map', category, variation, block)

                game.updateMap(category, variation, block)

            }

        });

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
                        if (player?.id == data.id) rplayer = player;
                    });

                    if (rplayer === undefined) {
                        //Initialise player
                        // game.initialisingPlayers.push( new Player( game, data ));        //keep this, good mechanism for async loading
                        remotePlayers.push(new Player(game, data));
                    } else {
                        //Player exists
                        remotePlayers.push(rplayer);
                    }
                }
            }
        });

        this.remotePlayers = remotePlayers;
        this.remotePlayers.forEach(function(player) {
            player.update();
        });
        //update hand meshes based on remote data - function in hands-controls.js
        updateMeshesFromServerData(pack, this);
    }

    playAnimationsInQueue() {
        const game = this;

        const animationQueue = [];

        game.animationQueue.forEach((anim) => {
            const dScale =
                Math.sin((Math.PI * ((90 * (12 - anim.duration)) / 24)) / 180) + 1;
            anim.object.scale.x = dScale;
            anim.object.scale.z = dScale;
            anim.duration--;

            if (anim.duration) animationQueue.push(anim);
            else {
                anim.object.scale.x = 1;
                anim.object.scale.z = 1;
            }
        });

        game.animationQueue = animationQueue;
    }

    animate() {
        const game = this;
        const dt = this.clock.getDelta();

        stats.update()
        game.controls.update()

        // this.randomDecay(0.05);


        game.playAnimationsInQueue();

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
                        $('#show-hands-label').show()
                        $('#show-crtl-label').hide()
                        // haven't found any hands
                        statusText = "Show some hands!";
                        dbg.clearRect(0, 0, dbg.canvas.width, dbg.canvas.height);
                        // dbg.drawImage(handsImage, 100, 100);
                        // console.log("Show some hands!");
                        game.noHandsTimeOut = setTimeout(() => {
                            game.controls.autoRotate = true;
                        },1000)
                    } else {
                        clearTimeout(game.noHandsTimeOut)
                        game.controls.autoRotate = false;
                        // display the confidence, to 3 decimal places
                        $('#show-hands-label').hide()
                        $('#show-crtl-label').show()
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

                        let avgHandPos = AVERAGE(game.handElevations);
                        if (avgHandPos > 1500) avgHandPos = 1500;

                        game.player.hands[0].landmarks.forEach((l) => {
                            l[2] += avgHandPos
                        });
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

        game.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
        game.raycaster.setFromCamera(game.pointer, game.camera);
        const intersects = game.raycaster.intersectObjects(
            [...Object.values(game.voxels), game.plane],
            false
        );
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
        const intersects = game.raycaster.intersectObjects(
            [...Object.values(game.voxels), game.plane],
            false
        );

        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (game.isCrtlDown) {
                // delete cube
                game.destroyBlock(intersect);
            } else {
                // create cube
                // console.log("add voxel");
                game.createBlock(intersect);
            }
        }
    }

    onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case 17:
                game.isCrtlDown = true;
                break;
            default:
                game.isCrtlDown = true;
                break;
        }
    }

    onDocumentKeyUp(event) {
        switch (event.keyCode) {
            case 17:
                game.isCrtlDown = false;
                break;
            default:
                game.isCrtlDown = false;
                break;
        }
    }

    handMovementCallback(position) {
        // console.log("Executing handMovementCallback!");
        //do things when hand moves

        position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        this.player.rollOverMesh.position.copy(position);

        this.raycaster.set(position, this.up);
        const intersectsAbove = this.raycaster.intersectObjects(
            [...Object.values(game.voxels), game.plane],
            false
        );
        if (intersectsAbove.length) {
            const upmost = intersectsAbove.pop();
            game.handElevations.push(upmost.point.y + 50);
        } else {
            game.handElevations.push(200);
        }
        game.handElevations.shift();

        this.raycaster.set(position, this.down);
        const intersects = this.raycaster.intersectObjects(
            [...Object.values(game.voxels), game.plane],
            false
        );

        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (game.isCrtlDown) {
                // delete cube
                game.destroyBlock(intersect);
            } else {
                // create cube
                // console.log("add voxel");
                game.createBlock(intersect);
            }
        }
    }

    randomDecay(probability) {
        if (Math.random() > probability) return;
        const game = this;
        const voxel = selectRandom(Object.values(game.voxels));
        if (!voxel) return;
        game.scene.remove(voxel);
        delete game.voxels[voxel.uuid];
        const blockIndex = game.objects.findIndex((o) => o.uuid === voxel.uuid);

        if (blockIndex > -1) {
            const block = game.objects[blockIndex];
            game.scene.remove(block);
            game.objects.splice(blockIndex, 1);
            game.player.socket.emit("remove", {
                uuid: block.uuid,
            });
        }
    }

    destroyBlock(intersect) {
        const game = this;

        if (intersect.object !== game.plane) {
            const voxel = intersect.object;
            game.scene.remove(voxel);
            delete game.voxels[voxel.uuid];
            const blockIndex = game.objects.findIndex((o) => o.uuid === voxel.uuid);

            if (blockIndex > -1) {
                const block = game.objects[blockIndex];
                game.scene.remove(block);
                game.objects.splice(blockIndex, 1);
                game.player.socket.emit("remove", {
                    uuid: block.uuid,
                });
            }
        }
    }

    createBlock(intersect) {
        const game = this;

        let position = new THREE.Vector3();
        position.copy(intersect.point).add(intersect.face.normal);
        position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

        let i = (position.x + (game.state.DIM * 50) / 2) / 50 - 0.5;
        let j = (position.y + (game.state.DIM * 50) / 2) / 50 - 0.5;
        let k = (position.z + (game.state.DIM * 50) / 2) / 50 - 0.5;

        if(!checkDomain(i, j, k, game.state.DIM)) return;

        const voxels = Object.values(game.voxels)

        for(const v of voxels) {
            if(position.equals(v.position)) {
                console.log('Already exists!')
                return;
            }
        }

        let uuid = generateUUID();
        let color = game.player.color;

        let params = { position, color, uuid };

        game.state["blocks"][uuid] = params; // need to update local state
        game.update("add", params); // update local
        game.player.socket.emit("add", params); // update global

        /*
        if (runWFC) {
            console.log("add modifier");
            wfcModifiers.push(params); // event loop wfc
            wfcDone = false;
        }
        */

    }
}