class Game {
    constructor() {
        if (!Detector.webgl) Detector.addGetWebGLMessage();

        this.container;
        this.player = {};
        this.stats;
        this.controls;
        this.camera;
        this.scene;
        this.renderer;

        this.container = document.createElement('div');
        this.container.style.height = '100%';
        document.body.appendChild(this.container);

        const game = this;

        this.assetsPath = './assets/';

        this.clock = new THREE.Clock();

        this.init();

        window.onError = function(error) {
            console.error(JSON.stringify(error));
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

        // this.loadEnvironment(loader);
        this.createPolarGrid()

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 150, 0);
        this.controls.update();

        window.addEventListener('resize', function() { game.onWindowResize(); }, false);

        this.animate()
    }


    createPolarGrid() {



        let numV = 100
        let numU = 10
        let radius = 1000
        let stepV = Math.PI * 2 / numV
        let stepU = radius / numU
                const geometry = new THREE.SphereGeometry(1, 32, 16);

        for (var r = 0; r < radius; r += stepU) {

            for (var angle = 0; angle < Math.PI * 2; angle += stepV) {

                let x = r * Math.cos(angle);
                let z = r * Math.sin(angle);


                let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 'whie' }))
                mesh.position.x = x
                mesh.position.z = z

                this.scene.add(mesh)

                // console.log('addMesh', x, z)


            }


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

        // const tloader = new THREE.CubeTextureLoader();
        // 	tloader.setPath( `${game.assetsPath}/images/` );

        // 	var textureCube = tloader.load( [
        // 		'px.jpg', 'nx.jpg',
        // 		'py.jpg', 'ny.jpg',
        // 		'pz.jpg', 'nz.jpg'
        // 	] );

        // game.scene.background = textureCube;


    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

    }

    animate() {
        const game = this;
        const dt = this.clock.getDelta();

        requestAnimationFrame(function() { game.animate(); });

        this.renderer.render(this.scene, this.camera);

    }
}