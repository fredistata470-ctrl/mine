import {
  BALL_FRICTION,
  BALL_POWER_SCALE,
  BALL_RADIUS,
  BALL_STOP_THRESHOLD,
  FIELD_HEIGHT,
  FIELD_WIDTH
} from '../config/constants.js';
import { clamp, normalizeVector } from '../utils/physics.js';

export default class Ball {
  constructor(scene) {
    this.scene = scene;
    this.x = FIELD_WIDTH / 2;
    this.y = FIELD_HEIGHT / 2;
    this.velocityX = 0;
    this.velocityY = 0;
    this.owner = null;
    this.radius = BALL_RADIUS;

    this.sprite = scene.add.circle(this.x, this.y, this.radius, 0xffffff, 1);
    this.sprite.setDepth(3);
  }

  update(deltaSec) {
    if (this.owner) {
      this.x = this.owner.x;
      this.y = this.owner.y;
      this.velocityX = 0;
      this.velocityY = 0;
      this.render();
      return;
    }

    this.x += this.velocityX * deltaSec;
    this.y += this.velocityY * deltaSec;

    this.velocityX *= BALL_FRICTION;
    this.velocityY *= BALL_FRICTION;

    if (Math.abs(this.velocityX) < BALL_STOP_THRESHOLD) {
      this.velocityX = 0;
    }

    if (Math.abs(this.velocityY) < BALL_STOP_THRESHOLD) {
      this.velocityY = 0;
    }

    this.x = clamp(this.x, this.radius, FIELD_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, FIELD_HEIGHT - this.radius);

    this.render();
  }

  setOwner(player) {
    if (this.owner && this.owner !== player) {
      this.owner.hasBall = false;
    }

    this.owner = player;
    if (player) {
      player.hasBall = true;
      this.velocityX = 0;
      this.velocityY = 0;
      this.x = player.x;
      this.y = player.y;
    }

    this.render();
  }

  release() {
    if (this.owner) {
      this.owner.hasBall = false;
    }
    this.owner = null;
  }

  shoot(targetX, targetY, power) {
    const direction = normalizeVector(this.x, this.y, targetX, targetY);
    this.release();
    const normalizedPower = Math.max(30, power);
    this.velocityX = direction.x * normalizedPower * BALL_POWER_SCALE;
    this.velocityY = direction.y * normalizedPower * BALL_POWER_SCALE;
  }

  pass(targetPlayer, accuracy) {
    const leadFactor = 10 * (1 - accuracy);
    const targetX = targetPlayer.x + ((Math.random() - 0.5) * leadFactor * 4);
    const targetY = targetPlayer.y + ((Math.random() - 0.5) * leadFactor * 4);
    const passPower = 55 + (accuracy * 35);
    this.shoot(targetX, targetY, passPower);
  }

  resetToCenter() {
    this.release();
    this.x = FIELD_WIDTH / 2;
    this.y = FIELD_HEIGHT / 2;
    this.velocityX = 0;
    this.velocityY = 0;
    this.render();
  }

  render() {
    this.sprite.setPosition(this.x, this.y);
  }
}
