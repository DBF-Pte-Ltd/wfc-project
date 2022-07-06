class Game{
	constructor(){
		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		
		this.container;
		this.player;
		this.stats;
		this.controls;
		this.camera;
		this.scene;
		this.renderer;
		
		this.remotePlayers = []
		this.initialisingPlayers = []
		this.remoteData = []

		this.objects = []
		
		this.container = document.createElement( 'div' );
		this.container.style.height = '100%';
		document.body.appendChild( this.container );
        
		const game = this;
		
		this.assetsPath = './assets/';
		
		this.clock = new THREE.Clock();
        
        this.init();

        window.onError = function(error) {
            console.error(JSON.stringify(error));
        }
    }

	update(key, value) {
		switch(key) {
			case 'add':
				// console.log('Game update: ', key, value)
				const remoteCubeMat = new THREE.MeshLambertMaterial( { color: value.color, map: new THREE.TextureLoader().load( 'assets/images/emoji.png' ) } );
				const voxel = new THREE.Mesh( game.player.cubeGeo, remoteCubeMat );
				voxel.position.copy( value.position );
				voxel.uuid = value.uuid
				game.scene.add( voxel );
				game.objects.push( voxel );
				break;
			case 'remove':
				const objectIndex = game.objects.findIndex(o => o.uuid === value.uuid)
				// console.log('Game update: ', key, value, objectIndex)
				if(objectIndex > -1) {
					game.scene.remove(game.objects[objectIndex])
					game.objects.splice( objectIndex, 1 );
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

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 20000);
        this.camera.position.set(500, 400, -500);

        this.scene = new THREE.Scene();

        let ambient = new THREE.AmbientLight(0xa0a0a0);

        let light = new THREE.HemisphereLight(0xdddddd, 0x444444);
        light.position.set(0, 200, 0);
        this.scene.add(light);

        // model
        const loader = new THREE.FBXLoader();
        const game = this;

		this.player = new PlayerLocal(this)

        this.loadEnvironment(loader);
        // this.createPolarGrid()

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 150, 0);
        this.controls.update();

        window.addEventListener('resize', function() { game.onWindowResize(); }, false);
        document.addEventListener('pointermove', game.onPointerMove);
        document.addEventListener('pointerdown', game.onPointerDown);
        document.addEventListener('keydown', game.onDocumentKeyDown);
        document.addEventListener('keyup', game.onDocumentKeyUp);

		/* const polygon = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,100), new THREE.Vector3(50,0,75), new THREE.Vector3(50,0,25)]
		const extrusion = extrude({polygon, depth: 50, material: null})
		this.scene.add(extrusion) */

        this.animate()
    }


    createPolarGrid() {


        let tiles = []

        let numV = 25
        let numU = 25
        let radius = 1000
        let stepV = Math.PI * 2 / numV
        let stepU = radius / numU
        const geometry = new THREE.SphereGeometry(1, 32, 16);

        let k = -0.10


        let u = 0
        let v = 0

        for (var r = stepU * 5; r < radius; r += stepU) {

            let row = []



            for (var angle = 0; angle < Math.PI * 2 + 1; angle += stepV) {



                let x = r * Math.cos(angle);
                let z = r * Math.sin(angle);

                let r1 = r 
                let r2 = r + stepU 
                let t1 = angle 
                let t2 =  angle + stepV 

                let a = getPolarCoordinate(r1,t1)
                let b = getPolarCoordinate(r1,t2)
                let c = getPolarCoordinate(r2,t2)
                let d = getPolarCoordinate(r2,t1)



                let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 'white' }))
                mesh.position.x = x
                mesh.position.z = z

                let y = Math.sqrt(x * x + z + z) * k

                // this.scene.add(mesh)


                let tile = { u, v, w: angle, h: stepU, mesh, x, y, z }
                tiles.push(tile)

                row.push(tile)

                u++
            }

            const points = row.map(o => new THREE.Vector3(o.x, o.y, o.z))
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xffffff }));
            this.scene.add(line);
            v++

        }

        function getPolarCoordinate(r, angle) {

            let x = r * Math.cos(angle);
            let y = r * Math.sin(angle);
            return new THREE.Vector2(x,y)

        }

    }



    loadEnvironment(loader) {
        const game = this;
        /* loader.load(`${this.assetsPath}fbx/town.fbx`, function(object){
			game.environment = object;
			game.colliders = [];
			game.scene.add(object);
            
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						game.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );	
		}) */

        const tloader = new THREE.CubeTextureLoader();
        tloader.setPath(`${game.assetsPath}/images/`);

        var textureCube = tloader.load([
            'c1.png',
            'c2.png',
            'top.png',
            'bottom.png',
            'c3.png',
            'c4.png',
        ]);

        // game.scene.background = textureCube;

        // roll-over helpers
        /* const rollOverGeo = new THREE.BoxGeometry(50, 50, 50);
        const rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
        game.rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
        game.scene.add(game.rollOverMesh); */

			/* game.cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
			game.cubeMaterial = new THREE.MeshLambertMaterial( { color: game.player.color, map: new THREE.TextureLoader().load( 'assets/images/abstract.jpg' ) } ); */


        // grid
        const gridHelper = new THREE.GridHelper(1000, 20);
        game.scene.add(gridHelper);

        //raycaster and pointer
        game.raycaster = new THREE.Raycaster();
        game.pointer = new THREE.Vector2();

        //shift press handler
        game.isShiftDown = false

        const geometry = new THREE.PlaneGeometry(1000, 1000);
        geometry.rotateX(-Math.PI / 2);

        game.plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false }));

        game.objects.push(game.plane)
        game.scene.add(game.plane);

    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

    }

	updateRemotePlayers() {
		if (this.remoteData===undefined || this.remoteData.length == 0 || this.player===undefined || this.player.id===undefined) return;

		const newPlayers = [];
		const game = this;
		//Get all remotePlayers from remoteData array
		const remotePlayers = [];

		this.remoteData.forEach( function(data){
			if (game.player.id != data.id){
				//Is this player being initialised?
				let iplayer;
				game.initialisingPlayers.forEach( function(player){
					if (player.id == data.id) iplayer = player;
				});
				//If not being initialised check the remotePlayers array
				if (iplayer===undefined){
					let rplayer;
					game.remotePlayers.forEach( function(player){
                        console.log('Player:: ', player)
						if (player?.id == data.id) rplayer = player;
					});

					if (rplayer===undefined){
						//Initialise player
						// game.initialisingPlayers.push( new Player( game, data ));
						remotePlayers.push(new Player( game, data ))
						// console.log('Remote players:: ', {remote: game.remotePlayers, toInit: game.initialisingPlayers})

					}else{
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
		this.remotePlayers.forEach(function(player){ player.update( ); });
	}

    animate() {
        const game = this;
        const dt = this.clock.getDelta();

        requestAnimationFrame(function() { game.animate(); });
		this.updateRemotePlayers(dt);

        this.renderer.render(this.scene, this.camera);
    }

    onPointerMove(event) {

        // console.log('Running onPointerMove.')

        game.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
        game.raycaster.setFromCamera(game.pointer, game.camera);
        const intersects = game.raycaster.intersectObjects(game.objects, false);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            game.player.rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
            game.player.rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
			// console.log('Update socket:: ', game.player.updateSocket)
			game.player.position = game.player.rollOverMesh.position
			game.player.updateSocket()
			// game.player.socket.emit("update", { uuid: game.player.id, position: game.player.rollOverMesh.position, color: game.player.color });
        }

    }

    onPointerDown(event) {

		game.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
        game.raycaster.setFromCamera(game.pointer, game.camera);
        const intersects = game.raycaster.intersectObjects(game.objects, false);

		if ( intersects.length > 0 ) {
			const intersect = intersects[ 0 ];
			// delete cube
			if ( game.isShiftDown ) {
				if ( intersect.object !== game.plane ) {
					game.scene.remove( intersect.object );
					game.objects.splice( game.objects.indexOf( intersect.object ), 1 );
					game.player.socket.emit("remove", { uuid: intersect.object.uuid });

				}
				// create cube
			} else {
				const voxel = new THREE.Mesh( game.player.cubeGeo, game.player.cubeMaterial );
				voxel.position.copy( intersect.point ).add( intersect.face.normal );
				voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
				game.scene.add( voxel );
				game.objects.push( voxel );
				game.player.socket.emit("add", {position: voxel.position, uuid: voxel.uuid, color: game.player.color});
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
}