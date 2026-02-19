// PreloadScene implementation

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Load assets here
    }

    create() {
        // Transition to next scene
        this.scene.start('NextScene');
    }
}

// Disable arcade debug
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [PreloadScene, /* other scenes */]
};

const game = new Phaser.Game(config);