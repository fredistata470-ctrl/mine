import {
  AI_DECISION_INTERVAL_MS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  GOALKEEPER_RADIUS,
  MAX_STAMINA,
  PASS_PROBABILITY_WHEN_PRESSURED,
  PASSING_PRESSURE_RANGE,
  PLAYER_RADIUS,
  SHOOTING_RANGE,
  STAMINA_DRAIN_PER_SECOND,
  STAMINA_RECOVERY_PER_SECOND,
  TEAM_COLORS
} from '../config/constants.js';
import { applyTeamPowerModifier } from '../utils/stats.js';
import { clamp, distanceBetween, randomInt, randomRange } from '../utils/physics.js';

const PLAYER_STATES = {
  HAS_BALL: 'HAS_BALL',
  CHASE_BALL: 'CHASE_BALL',
  POSITION: 'POSITION',
  GOALKEEPER: 'GOALKEEPER'
};

export default class Player {
  constructor(scene, config) {
    this.scene = scene;
    this.id = config.id;
    this.team = config.team;
    this.isGoalkeeper = Boolean(config.isGoalkeeper);
    this.role = config.role;

    this.x = config.x;
    this.y = config.y;
    this.formationX = config.formationX;
    this.formationY = config.formationY;

    this.speed = config.speed;
    this.attack = config.attack;
    this.defense = config.defense;
    this.stamina = config.stamina;

    this.hasBall = false;
    this.state = this.isGoalkeeper ? PLAYER_STATES.GOALKEEPER : PLAYER_STATES.POSITION;
    this.radius = this.isGoalkeeper ? GOALKEEPER_RADIUS : PLAYER_RADIUS;

    this.decisionCooldownMs = randomInt(40, 180);

    this.sprite = scene.add.circle(this.x, this.y, this.radius, TEAM_COLORS[this.team], 1);
    this.outline = scene.add.circle(this.x, this.y, this.radius + 4);
    this.outline.setStrokeStyle(0);
    this.outline.setDepth(2);
    this.sprite.setDepth(2);
  }

  update(scene, deltaMs, ball, teammates, opponents, teamPower) {
    const deltaSec = deltaMs / 1000;
    this.decisionCooldownMs -= deltaMs;

    const effectiveStats = applyTeamPowerModifier(this, teamPower);

    if (this.hasBall) {
      this.state = PLAYER_STATES.HAS_BALL;
      this.handleBallState(scene, deltaSec, ball, teammates, opponents, effectiveStats);
      this.stamina = clamp(this.stamina - (STAMINA_DRAIN_PER_SECOND * deltaSec), 0, MAX_STAMINA);
    } else {
      this.state = this.pickOffBallState(ball, teammates, scene.playersByTeam[this.team]);

      if (this.state === PLAYER_STATES.CHASE_BALL) {
        this.moveTo(ball.x, ball.y, deltaSec, effectiveStats.effectiveSpeed);
        this.stamina = clamp(this.stamina - (STAMINA_DRAIN_PER_SECOND * deltaSec), 0, MAX_STAMINA);
      } else if (this.state === PLAYER_STATES.GOALKEEPER) {
        this.handleGoalkeeperState(ball, deltaSec, effectiveStats.effectiveSpeed);
        this.stamina = clamp(this.stamina - (STAMINA_DRAIN_PER_SECOND * 0.4 * deltaSec), 0, MAX_STAMINA);
      } else {
        this.moveTo(this.formationX, this.formationY, deltaSec, effectiveStats.effectiveSpeed * 0.85);
        this.stamina = clamp(this.stamina + (STAMINA_RECOVERY_PER_SECOND * deltaSec), 0, MAX_STAMINA);
      }
    }

    this.render();
  }

  handleBallState(scene, deltaSec, ball, teammates, opponents, effectiveStats) {
    const targetGoalX = this.team === 'home' ? FIELD_WIDTH : 0;
    const targetGoalY = FIELD_HEIGHT / 2;

    const distanceToGoal = distanceBetween(this.x, this.y, targetGoalX, targetGoalY);
    const nearbyDefenders = opponents.filter((opponent) => distanceBetween(this.x, this.y, opponent.x, opponent.y) < PASSING_PRESSURE_RANGE);

    if (distanceToGoal < SHOOTING_RANGE && this.decisionReady()) {
      this.shoot(scene, ball, effectiveStats.effectiveAttack);
      return;
    }

    const shouldPass = nearbyDefenders.length > 0 && Math.random() < PASS_PROBABILITY_WHEN_PRESSURED;
    if (shouldPass && this.decisionReady()) {
      const teammate = this.findBestPassTarget(teammates);
      if (teammate) {
        this.pass(scene, ball, teammate, effectiveStats.effectiveAttack);
        return;
      }
    }

    this.moveTo(targetGoalX, targetGoalY, deltaSec, effectiveStats.effectiveSpeed * 0.95);
  }

  handleGoalkeeperState(ball, deltaSec, effectiveSpeed) {
    const targetX = this.team === 'home' ? 95 : FIELD_WIDTH - 95;
    const idealY = clamp(ball.y, 220, 380);
    this.moveTo(targetX, idealY, deltaSec, effectiveSpeed * 0.95);
  }

  pickOffBallState(ball, teammates, teamPlayers) {
    if (this.isGoalkeeper) {
      return PLAYER_STATES.GOALKEEPER;
    }

    const closest = this.isClosestToBall(teamPlayers, ball);
    return closest ? PLAYER_STATES.CHASE_BALL : PLAYER_STATES.POSITION;
  }

  moveTo(targetX, targetY, deltaSec, speed) {
    const currentSpeed = speed * (0.55 + (this.stamina / MAX_STAMINA) * 0.45);
    const directionX = targetX - this.x;
    const directionY = targetY - this.y;
    const length = Math.hypot(directionX, directionY);

    if (length < 1) {
      return;
    }

    const vx = (directionX / length) * currentSpeed;
    const vy = (directionY / length) * currentSpeed;

    this.x += vx * deltaSec;
    this.y += vy * deltaSec;

    this.x = clamp(this.x, this.radius, FIELD_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, FIELD_HEIGHT - this.radius);
  }

  shoot(scene, ball, attackStat) {
    const goalX = this.team === 'home' ? FIELD_WIDTH : 0;
    const goalY = FIELD_HEIGHT / 2;

    const goalkeeper = scene.getGoalkeeper(this.team === 'home' ? 'away' : 'home');
    const shotPower = attackStat + randomInt(0, 25);
    const saveAbility = goalkeeper ? goalkeeper.defense + randomInt(0, 15) : 0;

    scene.matchState[`${this.team}Shots`] += 1;

    if (shotPower > saveAbility) {
      ball.shoot(goalX, goalY + randomRange(-20, 20), shotPower);
    } else {
      const deflectX = goalX + (this.team === 'home' ? -1 : 1) * randomInt(40, 120);
      const deflectY = goalY + randomInt(-120, 120);
      ball.shoot(deflectX, deflectY, shotPower * 0.5);
    }
  }

  pass(scene, ball, targetPlayer, attackStat) {
    const passAccuracy = attackStat + randomInt(0, 20);
    const distance = distanceBetween(this.x, this.y, targetPlayer.x, targetPlayer.y);
    const passSuccessThreshold = 50 + (distance / 10);

    scene.matchState[`${this.team}Passes`] += 1;

    if (passAccuracy > passSuccessThreshold) {
      ball.pass(targetPlayer, 1);
      scene.matchState[`${this.team}PassesCompleted`] += 1;
      return;
    }

    const errorX = randomInt(-60, 60);
    const errorY = randomInt(-60, 60);
    ball.shoot(targetPlayer.x + errorX, targetPlayer.y + errorY, 45);
  }

  findBestPassTarget(teammates) {
    const eligibleTeammates = teammates.filter((teammate) => teammate !== this);

    if (!eligibleTeammates.length) {
      return null;
    }

    const sorted = eligibleTeammates.sort((a, b) => {
      const aProgress = this.team === 'home' ? a.x : (FIELD_WIDTH - a.x);
      const bProgress = this.team === 'home' ? b.x : (FIELD_WIDTH - b.x);
      return bProgress - aProgress;
    });

    return sorted[0];
  }

  isClosestToBall(players, ball) {
    let minDistance = Infinity;
    let closestPlayerId = null;

    players.forEach((player) => {
      const dist = distanceBetween(player.x, player.y, ball.x, ball.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestPlayerId = player.id;
      }
    });

    return closestPlayerId === this.id;
  }

  decisionReady() {
    if (this.decisionCooldownMs <= 0) {
      this.decisionCooldownMs = AI_DECISION_INTERVAL_MS + randomInt(0, 180);
      return true;
    }

    return false;
  }

  render() {
    this.sprite.setPosition(this.x, this.y);
    this.outline.setPosition(this.x, this.y);
    this.outline.setStrokeStyle(this.hasBall ? 2 : 0, TEAM_COLORS.ballOwnerRing, 1);
  }
}
