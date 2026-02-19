export default class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  preload() {
    // Prefer spritesheets (harmless if missing)
    this.load.spritesheet('player_blue', 'assets/players/player_blue_spritesheet.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_red', 'assets/players/player_red_spritesheet.png', { frameWidth: 48, frameHeight: 64 });

    // Load the field (note: repo currently has soccer_field.png.png)
    this.load.image('field', 'assets/soccer_field.png.png');

    // Ball (repo has assets/ball.png)
    this.load.image('ball', 'assets/ball.png');

    // Goalie(s) - load the actual filename present in repo
    this.load.image('goalie_Westfield', 'assets/goalie_Westfield.png');
    this.load.image('goalie_Northfield', 'assets/goalie_Northfield.png');

    // Load individual player images that exist in repo (safe if missing)
    for (let i = 1; i <= 7; i++) {
      this.load.image(`player${i}`, `assets/player${i}.png`);
    }
    ['a','b','c','d','e','f','g'].forEach(ch => this.load.image(`player${ch}`, `assets/player${ch}.png`));

    // Load placeholder audio (we will add a small silent mp3 file)
    this.load.audio('menu_music', 'assets/audio/menu_music.mp3');

    // Loading UI
    const loading = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Loading...', {
      fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    // Log concise warnings for missing files (prevents spam)
    const missing = new Set();
    this.load.on('fileerror', (file) => {
      if (!missing.has(file.src)) {
        missing.add(file.src);
        // Use warn so it's visible but not noisy
        console.warn('[Preload] failed to load:', file.key, file.src);
      }
    });

    this.load.on('complete', () => loading.destroy());
  }

  create() {
    // Generate minimal placeholders for any missing textures so the game never shows default green boxes
    const placeholders = [
      { key: 'field', w: 1000, h: 600, color: 0x2e7d32 },
      { key: 'ball', w: 16, h: 16, color: 0xffffff },
      { key: 'player_blue', w: 48, h: 64, color: 0x1976d2 },
      { key: 'player_red', w: 48, h: 64, color: 0xd32f2f },
      { key: 'goalie_Westfield', w: 48, h: 64, color: 0xffcc00 },
      { key: 'goalie_Northfield', w: 48, h: 64, color: 0xffcc00 }
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

    this.scene.start('MatchScene');
  }
}