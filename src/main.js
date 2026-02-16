import MatchScene from './scenes/MatchScene.js';
import { FIELD_HEIGHT, FIELD_WIDTH } from './config/constants.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: FIELD_WIDTH,
  height: FIELD_HEIGHT,
  backgroundColor: '#000000',
  scene: [MatchScene],
  fps: {
    target: 60,
    forceSetTimeOut: false
  }
};

new Phaser.Game(config);
