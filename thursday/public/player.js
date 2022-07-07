class Player {
    constructor(game, props) {
        this.local = true;
        let avatar, color   
        this.game = game


        if(props===undefined) {
            const avatars = ['BeachBabe', 'BusinessMan', 'Doctor', 'FireFighter', 'Housewife', 'Policeman', 'Prostitute', 'Punk', 'RiotCop', 'Roadworker', 'Robber', 'Sheriff', 'Streetman', 'Waitress'];
            avatar = avatars[Math.floor(Math.random()*avatars.length)];
            color = Math.random() * 0xffffff
        }
        else {
            this.id = props.id
            avatar = props.avatar
            color = props.color
            this.local = false
        }
        this.avatar = avatar
        this.color = color
        this.position = new THREE.Vector3()
        
        const rollOverGeo = new THREE.BoxGeometry(50, 50, 50);
        const rollOverMaterial = new THREE.MeshBasicMaterial({ color: this.color, opacity: 0.5, transparent: true });
        this.rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
        this.rollOverMesh.position.set(this.position)
        this.game.scene.add(this.rollOverMesh);

        this.cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
		this.cubeMaterial = new THREE.MeshLambertMaterial( { color: this.color, map: new THREE.TextureLoader().load( 'assets/images/emoji.png' ) } );

        if(!this.local) {
            const players = this.game.initialisingPlayers.splice(this.game.initialisingPlayers.indexOf(this), 1);
            this.game.remotePlayers.push(players[0]);
            // console.log('Non local player:: ', players, this.game.remotePlayers)
        }

    }

    update() {
        if (this.game.remoteData.length>0){
			let found = false;
			for(let data of this.game.remoteData){
                
                if (data.id != this.id) continue;
				//Found the player
                // console.log('Updating remote player:: ', this.position)
                this.position.set(data.position.x, data.position.y, data.position.z)
				this.rollOverMesh.position.copy( this.position );
				found = true;
			}
			if (!found) this.game.removePlayer(this);
		}
    }

}

class PlayerLocal extends Player {
    constructor(game, props) {
        super(game, props)

        const player = this
        const socket = io()

        socket.on('player:joined', function(data) {
            // console.log('Setting player ID:: ', data.id)
            player.id = data.id
        })


        
        socket.on('updatePlayer', function(data) {

            for (let prop in data) {
                player[prop] = data[prop]
            }

        })
        


        socket.on('restoreState', function({state}) {

            game.restoreState(state)

        })

        /* socket.on('player:new-remote', function(data) {
            player.game.update('player:new-remote', data)
        }) */

        /* socket.on('update', function(data) {
            player.game.update('player:new-remote', data)
        }) */

        socket.on('add', function(data) {
            // console.log('Socket add!', data)
            player.game.update('add', data)
        })

        socket.on('remove', function(data) {
            player.game.update('remove', data)
        })

        /* socket.on('remoteData', function(data) {
            player.game.update('remoteData', data)
        }) */

        socket.on('remoteData', function(data){
			game.remoteData = data;
		});


        this.socket = socket
        this.initSocket()
    }

    initSocket() {
        this.socket.emit('init', { 
			avatar:this.avatar, 
			color: this.color,
			position: this.position,
		});
    }

    updateSocket() {
        // console.log('Updating player socket!', this.position)
        this.socket.emit('update', { 
			avatar:this.avatar, 
			color: this.color,
			position: this.position,
            hands: this.hands
		});
    }
}