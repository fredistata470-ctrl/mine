// Player.js

// Update to prefer spritesheets/images
class Player {
    constructor() {
        // Initialization code
        this.spriteSheet = 'path/to/spriteSheet.png'; 
        this.image = null;
    }

    loadImage() {
        this.image = new Image();
        this.image.src = this.spriteSheet;
    }

    draw(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y);
        }
    }
}