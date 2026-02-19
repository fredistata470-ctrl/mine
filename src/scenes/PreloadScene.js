export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Attempt to load real assets if present in the repo/workspace
    const images = [
      { key: 'field', url: 'assets/field.png' },
      { key: 'ball', url: 'assets/ball.png' },
      { key: 'goalie_Westward', url: 'assets/players/goalie_Westward.png' },
      { key: 'player_home', url: 'assets/players/player_home.png' },
      { key: 'player_away', url: 'assets/players/player_away.png' }
    ];

    images.forEach((img) => {
      this.load.image(img.key, img.url);
    });

    // Try to load audio (if present)
    this.load.audio('menu_music', 'assets/audio/menu_music.mp3');

    // Loading UI
    const loading = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Loading...', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('complete', () => {
      loading.destroy();
    });
  }

  create() {
    // For any missing textures, create simple placeholder textures so the game never shows missing-texture boxes.
    const placeholders = [
      { key: 'field', w: 1000, h: 600, color: 0x2e7d32 },
      { key: 'ball', w: 16, h: 16, color: 0xffffff },
      { key: 'goalie_Westward', w: 48, h: 64, color: 0xffcc00 },
      { key: 'player_home', w: 48, h: 64, color: 0x1976d2 },
      { key: 'player_away', w: 48, h: 64, color: 0xd32f2f }
    ];

    placeholders.forEach((p) => {
      if (!this.textures.exists(p.key)) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(p.color, 1);
        g.fillRect(0, 0, p.w, p.h);
        g.lineStyle(2, 0x000000, 1);
        g.strokeRect(0, 0, p.w, p.h);
        g.generateTexture(p.key, p.w, p.h);
        g.destroy();
      }
    });

    // If audio didn't load, we don't need to create a placeholder — audio can be optional.

    // Begin main scene
    this.scene.start('MatchScene');
  }
}