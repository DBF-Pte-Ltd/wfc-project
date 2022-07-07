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

        this.container = document.createElement("div");
        this.container.style.height = "100%";
        document.body.appendChild(this.container);

        const game = this;

        this.assetsPath = "./assets/";

        this.clock = new THREE.Clock();

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
        this.pointer = new THREE.Vector2();

        //shift press handler
        this.isShiftDown = false;

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
                    color: value.color,
                });
                const voxel = new THREE.Mesh(game.player.cubeGeo, remoteCubeMat);
                voxel.position.copy(value.position);
                voxel.uuid = value.uuid;
                game.scene.add(voxel);
                game.objects.push(voxel);
                startOver();
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

    init() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            10,
            20000
        );
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
            this.renderer.domElement
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
        if (
            this.remoteData === undefined ||
            this.remoteData.length == 0 ||
            this.player === undefined ||
            this.player.id === undefined
        )
            return;

        const newPlayers = [];
        const game = this;
        //Get all remotePlayers from remoteData array
        const remotePlayers = [];

        this.remoteData.forEach(function(data) {
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
                        if (player ? .id == data.id) rplayer = player;
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
        updateMeshesFromServerData(this.remoteData, this);
    }

    animate() {
        const game = this;
        const dt = this.clock.getDelta();

        if (animatedMesh) {
            animatedMesh.material.map.dispose();
            animatedMesh.material.map = new THREE.CanvasTexture(myP5.oCanvas);
            animatedMesh.material.needsUpdate = true;
        }

        requestAnimationFrame(function() {
            game.animate();
        });
        this.updateRemotePlayers(dt);

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
                if (game.player.hands[0])
                    game.player.hands[0].landmarks.forEach((l) => (l[2] += 200));
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
            if (game.isShiftDown) {
                if (intersect.object !== game.plane) {
                    game.scene.remove(intersect.object);
                    game.objects.splice(game.objects.indexOf(intersect.object), 1);
                    game.player.socket.emit("remove", { uuid: intersect.object.uuid });
                }
                // create cube
            } else {
                // let position = new THREE.Vector3();
                // position.copy(intersect.point).add(intersect.face.normal);
                // position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
                // let uuid = generateUUID();
                // let color = game.player.color;

                // game.update("add", { position, color, uuid }); // update local
                // game.player.socket.emit("add", { position, color, uuid }); // update global


                let position = new THREE.Vector3()
                position.copy(intersect.point).add(intersect.face.normal);
                position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
                let uuid = generateUUID()
                let color = game.player.color

                let params = { position, color, uuid }

                game.state['blocks'][uuid] = params // need to update local state 
                game.update("add", params) // update local 
                game.player.socket.emit("add", params); // update global


                wfcDone = false
                wfcModifiers.push(params) // event loop wfc 


            }
        }
    }

    onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case 16:
                game.isShiftDown = true;
                break;
        }
    }

    onDocumentKeyUp(event) {
        switch (event.keyCode) {
            case 16:
                game.isShiftDown = false;
                break;
        }
    }

    handMovementCallback(position) {
        //do things when hand moves

        position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        // console.log('position:: ', position)
        this.player.rollOverMesh.position.copy(position);

        /* for (const object of game.objects) {
          if (position.equals(object.position)) {
            object.material =
              object.material.clone(); 
            object.material.color.setHex(0xffffff);
            console.log("Found intersection!");
          }
        } */

        this.raycaster.set(position, this.down);
        const intersects = this.raycaster.intersectObjects(this.objects, false);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            // delete cube
            if (this.isShiftDown) {
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
                let uuid = generateUUID();
                let color = this.player.color;

                this.update("add", { position, color, uuid }); // update local
                this.player.socket.emit("add", { position, color, uuid }); // update global
            }
        }
    }


    requestAnimationFrame(function() {
        game.animate();
    });
    this.updateRemotePlayers(dt);

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
            // console.log('Player hand:: ', game.player.hands)
            if (game.player.hands[0])
                game.player.hands[0].landmarks.forEach((l) => (l[2] += 200));
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

    this.renderer.render(this.scene, this.camera);
}

onPointerMove(event) {
    // console.log('Running onPointerMove.')
    //moved this functionality to hand
    /* game.pointer.set(
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
    } */
}

onPointerDown(event) {
    //this functionality is tied to hand now
    /* game.pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    game.raycaster.setFromCamera(game.pointer, game.camera);
    const intersects = game.raycaster.intersectObjects(game.objects, false);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      // delete cube
      if (game.isShiftDown) {
        if (intersect.object !== game.plane) {
          game.scene.remove(intersect.object);
          game.objects.splice(game.objects.indexOf(intersect.object), 1);
          game.player.socket.emit("remove", { uuid: intersect.object.uuid });
        }
        // create cube
      } else {
        let position = new THREE.Vector3();
        position.copy(intersect.point).add(intersect.face.normal);
        position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        let uuid = generateUUID();
        let color = game.player.color;

        game.update("add", { position, color, uuid }); // update local
        game.player.socket.emit("add", { position, color, uuid }); // update global
      }
    } */
}

onDocumentKeyDown(event) {
    switch (event.keyCode) {
        case 16:
            game.isShiftDown = true;
            break;
    }
}

onDocumentKeyUp(event) {
    switch (event.keyCode) {
        case 16:
            game.isShiftDown = false;
            break;
    }
}

handMovementCallback(position) {
    console.log('Executing handMovementCallback!')
    //do things when hand moves

    position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
    // console.log('position:: ', position)
    this.player.rollOverMesh.position.copy(position);

    /* for (const object of game.objects) {
      if (position.equals(object.position)) {
        object.material =
          object.material.clone(); 
        object.material.color.setHex(0xffffff);
        console.log("Found intersection!");
      }
    } */

    this.raycaster.set(position, this.down);
    const intersects = this.raycaster.intersectObjects(this.objects, false);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        // delete cube
        if (this.isShiftDown) {
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
            let uuid = generateUUID();
            let color = this.player.color;

            this.update("add", { position, color, uuid }); // update local
            this.player.socket.emit("add", { position, color, uuid }); // update global
        }
    }
}
}