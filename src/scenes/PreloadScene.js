export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Load field and ball
    this.load.image('field', 'assets/soccer_field.png.png');
    this.load.image('ball', 'assets/ball.png');

    // Goalkeepers
    this.load.image('goalie_Northfield', 'assets/goalie_Northfield.png');
    this.load.image('goalie_Westfield', 'assets/goalie_Westfield.png');

    // Player sets (home: player1..player7, away: playera..playerg)
    for (let i = 1; i <= 7; i++) {
      this.load.image(`player${i}`, `assets/player${i}.png`);
    }
    const letters = ['a','b','c','d','e','f','g'];
    letters.forEach((ch, idx) => {
      this.load.image(`player${ch}`, `assets/player${ch}.png`);
    });

    // Additional variants
    ['playera','playerb','playerc','playerd','playere','playerf','playerg'].forEach(k => {
      this.load.image(k, `assets/${k}.png`);
    });

    // Audio (optional)
    this.load.audio('menu_music', 'assets/audio/menu_music.mp3');

    // Loading UI
    const loading = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Loading...', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('complete', () => loading.destroy());
  }

  create() {
    // Create fallback textures for any missing keys so Phaser never shows missing-texture boxes
    const placeholders = [
      { key: 'field', w: 1000, h: 600, color: 0x2e7d32 },
      { key: 'ball', w: 16, h: 16, color: 0xffffff },
      { key: 'goalie_Northfield', w: 48, h: 64, color: 0xffcc00 },
      { key: 'goalie_Westfield', w: 48, h: 64, color: 0xffcc00 }
    ];

    // player keys
    for (let i = 1; i <= 7; i++) placeholders.push({ key: `player${i}`, w: 48, h: 64, color: 0x1976d2 });
    ['a','b','c','d','e','f','g'].forEach((ch) => placeholders.push({ key: `player${ch}`, w: 48, h: 64, color: 0xd32f2f }));

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

    // Start main match scene
    this.scene.start('MatchScene');
  }
}