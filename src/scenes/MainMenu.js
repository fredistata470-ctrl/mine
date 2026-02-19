class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  preload() {
    this.load.image('menu_bg', 'assets/backgrounds/menu_bg.png');
    this.load.image('button_story', 'assets/ui/button_story.png');
    this.load.image('button_training', 'assets/ui/button_training.png');
    this.load.audio('menu_music', ['assets/sfx/menu_music.mp3']);
  }

  create() {
    // Try to play menu music if available
    try {
      this.menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
      this.menuMusic.play();
    } catch (e) {
      console.warn('Menu music missing or failed to play.');
    }

    const w = this.scale.width;
    const h = this.scale.height;
    this.add.image(w/2, h/2, 'menu_bg').setDisplaySize(Math.min(w,1000), Math.min(h,600));
    this.add.text(w/2, h*0.18, 'Westen & Xiao Champion League', {
      fontFamily: 'Arial', fontSize: '44px', color: '#ffff00', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    // Story button (prefer image, fallback to text)
    let storyBtn;
    if (this.textures.exists('button_story')) {
      storyBtn = this.add.image(w/2, h/2 - 20, 'button_story').setInteractive();
      storyBtn.setDisplaySize(320, 80);
      this.add.text(storyBtn.x, storyBtn.y, 'STORY MODE', { fontFamily: 'Arial', fontSize: '32px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
    } else {
      storyBtn = this.add.text(w/2, h/2 - 20, 'STORY MODE', {
        fontFamily: 'Arial', fontSize: '32px', color: '#ffffff', backgroundColor: '#0077aa', padding: { left: 12, right: 12, top: 8, bottom: 8 }
      }).setOrigin(0.5).setInteractive();
    }
    storyBtn.on('pointerup', () => {
      if (this.menuMusic) { this.menuMusic.stop(); this.menuMusic = null; }
      if (window.StoryScene) {
        this.scene.start('StoryScene');
      } else if (window.StoryGameScene) {
        this.scene.start('StoryGameScene');
      } else {
        console.warn('StoryScene not present.');
      }
    });

    // Training button (optional)
    let trainingBtn;
    if (this.textures.exists('button_training')) {
      trainingBtn = this.add.image(w/2, h/2 + 80, 'button_training').setInteractive();
      trainingBtn.setDisplaySize(320, 80);
      this.add.text(trainingBtn.x, trainingBtn.y, 'TRAINING', { fontFamily: 'Arial', fontSize: '28px', color: '#000' }).setOrigin(0.5);
    } else {
      trainingBtn = this.add.text(w/2, h/2 + 80, 'TRAINING', {
        fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', backgroundColor: '#444', padding: { left: 12, right: 12, top: 8, bottom: 8 }
      }).setOrigin(0.5).setInteractive();
    }
    trainingBtn.on('pointerup', () => {
      if (this.menuMusic) { this.menuMusic.stop(); this.menuMusic = null; }
      if (window.TrainingScene) this.scene.start('TrainingScene');
      else console.warn('TrainingScene not present.');
    });

    if (!this.sound.get('menu_music')) {
      this.add.text(w/2, h*0.92, 'Tip: menu music missing', { fontSize: '14px', color: '#ff8888' }).setOrigin(0.5);
    }
  }
}

window.MainMenu = MainMenu;