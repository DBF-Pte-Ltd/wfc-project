class Player {
    constructor(game, options) {
        this.game = game
        this.color = Math.random() * 0xffffff
    }

}

class PlayerLocal extends Player {
    constructor(game, model) {
        super(game, model)

        const player = this
        const socket = io()

        socket.on('player:joined', function(data) {
            player.id = data.id
        })

        socket.on('add', function(data) {
            player.game.update('add', data)
        })

        socket.on('remove', function(data) {
            player.game.update('remove', data)
        })


        this.socket = socket
    }
}