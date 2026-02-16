import {
  BALL_FRICTION,
  BALL_POWER_SCALE,
  BALL_RADIUS,
  BALL_STOP_THRESHOLD,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  PLAYER_REACH,
  BALL_HOMING_STRENGTH
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
    this.state = 'WAITING'; // WAITING, IN_PASS, IN_PLAY, POSSESSED
    this.target = null; // for passes: {x,y,playerId}
    this.stuckTimer = 0;
    this.lockTimer = 0;
    this.radius = BALL_RADIUS;

    this.sprite = scene.add.circle(this.x, this.y, Math.max(this.radius, 6), 0xffffff, 1);
    this.sprite.setDepth(3);
  }

  update(deltaSec) {
    // Countdown lock timer
    if (this.lockTimer > 0) {
      this.lockTimer = Math.max(0, this.lockTimer - deltaSec);
    }

    // Follow carrier while locked
    if (this.owner && this.lockTimer > 0) {
      this.x = this.owner.x;
      this.y = this.owner.y;
      this.state = 'POSSESSED';
    } else if (this.owner && this.lockTimer <= 0) {
      // Release owner with small random nudge if velocity zero
      if (Math.hypot(this.velocityX, this.velocityY) < 0.01) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 2;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
      }
      this.owner = null;
      this.state = 'IN_PLAY';
    }

    // Move ball
    this.x += this.velocityX * deltaSec;
    this.y += this.velocityY * deltaSec;

    // Friction
    this.velocityX *= BALL_FRICTION;
    this.velocityY *= BALL_FRICTION;

    // Stop very small velocities
    if (Math.abs(this.velocityX) < BALL_STOP_THRESHOLD) {
      this.velocityX = 0;
    }
    if (Math.abs(this.velocityY) < BALL_STOP_THRESHOLD) {
      this.velocityY = 0;
    }

    // Clamp to field
    this.x = clamp(this.x, this.radius, FIELD_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, FIELD_HEIGHT - this.radius);

    // Detect stuck
    const speed = Math.hypot(this.velocityX, this.velocityY);
    if (speed < 0.5) {
      this.stuckTimer += deltaSec;

      // Gentle nudge from nearest player
      const nearby = (this.scene.players || [])
        .map((p) => ({ p, d: Math.hypot(p.x - this.x, p.y - this.y) }))
        .filter((o) => o.d < 24)
        .sort((a, b) => a.d - b.d);

      if (nearby.length > 0) {
        const p = nearby[0].p;
        const angle = Math.atan2(p.y - this.y, p.x - this.x);
        const nudge = 0.6 + Math.min(1.2, 0.02 * (24 - nearby[0].d));
        this.velocityX += Math.cos(angle) * nudge;
        this.velocityY += Math.sin(angle) * nudge;
        this.state = 'IN_PLAY';
        this.stuckTimer = 0;
      }

      // If stuck too long, assign nearest player
      if (this.stuckTimer > 2.0) {
        let closest = null;
        let minDist = Infinity;
        for (const p of (this.scene.players || [])) {
          const d = Math.hypot(p.x - this.x, p.y - this.y);
          if (d < minDist) {
            minDist = d;
            closest = p;
          }
        }
        if (closest) {
          this.setOwner(closest);
        }
        this.stuckTimer = 0;
        return;
      }
    } else {
      this.stuckTimer = 0;
    }

    // Homing to pass target
    if (this.target && this.target.playerId && !this.owner) {
      const targetPlayer = (this.scene.players || []).find((p) => p.id === this.target.playerId);
      if (targetPlayer) {
        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= PLAYER_REACH) {
          this.setOwner(targetPlayer);
          return;
        }

        const dir = normalizeVector(this.x, this.y, targetPlayer.x, targetPlayer.y);
        const spd = Math.hypot(this.velocityX, this.velocityY) || 1;
        this.velocityX = this.velocityX * (1 - BALL_HOMING_STRENGTH) + dir.x * spd * BALL_HOMING_STRENGTH;
        this.velocityY = this.velocityY * (1 - BALL_HOMING_STRENGTH) + dir.y * spd * BALL_HOMING_STRENGTH;
      }
    }

    this.render();
  }

  setOwner(player) {
    if (this.owner && this.owner !== player) {
      this.owner.hasBall = false;
    }
    this.owner = player;
    if (player) {
      player.hasBall = true;
      this.x = player.x;
      this.y = player.y;
      this.lockTimer = 0.2;
      this.state = 'POSSESSED';
      player.decisionCooldownMs = 0;
      player.decisionTimer = 0;
      player.state = player.state || 'IDLE';
      player.receiveTarget = null;
    }
    this.render();
  }

  release() {
    if (this.owner) {
      this.owner.hasBall = false;
    }
    this.owner = null;
    this.state = 'IN_PLAY';
    this.target = null;
    this.stuckTimer = 0;
  }

  shoot(targetX, targetY, power = 18) {
    const dir = normalizeVector(this.x, this.y, targetX, targetY);
    this.release();
    const scaledPower = power * BALL_POWER_SCALE;
    this.velocityX = dir.x * scaledPower;
    this.velocityY = dir.y * scaledPower;
    this.state = 'IN_PLAY';
    this.target = { x: targetX, y: targetY };
    this.stuckTimer = 0;
  }

  pass(targetPlayer, accuracy = 0.8) {
    const leadFactor = 10 * (1 - accuracy);
    const targetX = targetPlayer.x + (Math.random() - 0.5) * leadFactor * 4;
    const targetY = targetPlayer.y + (Math.random() - 0.5) * leadFactor * 4;
    const passPower = 18 + 12 * accuracy;
    this.target = { x: targetX, y: targetY, playerId: targetPlayer.id };
    this.state = 'IN_PASS';
    this.stuckTimer = 0;
    this.shoot(targetX, targetY, passPower);
    this.target = { x: targetX, y: targetY, playerId: targetPlayer.id };
    this.state = 'IN_PASS';
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
