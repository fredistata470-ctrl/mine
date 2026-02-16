import Ball from '../entities/Ball.js';
import Player from '../entities/Player.js';
import {
  FIELD_HEIGHT,
  FIELD_WIDTH,
  GOAL_DEPTH,
  GOAL_WIDTH,
  MATCH_DURATION,
  PLAYER_REACH,
  POSSESSION_COOLDOWN_MS,
  STAT_RANGES,
  TEAM_COLORS
} from '../config/constants.js';
import { FORMATION_1_2_2_2 } from '../config/formations.js';
import { isCircleCollision, randomInt } from '../utils/physics.js';
import { calculateTeamPower } from '../utils/stats.js';

export default class MatchScene extends Phaser.Scene {
  constructor() {
    super('MatchScene');
  }

  create() {
    this.players = [];
    this.playersByTeam = { home: [], away: [] };
    this.matchState = this.createMatchState();
    this.teamPower = { home: 70, away: 70 };
    this.matchPausedUntil = 0;
    this.lastPossessionSwapAt = 0;

    this.drawField();
    this.createTeams();

    this.ball = new Ball(this);
    this.ball.resetToCenter();

    this.createHud();
    this.updateScoreboard();
    this.updateTimerText();
  }

  update(_time, delta) {
    if (this.matchState.isMatchOver) {
      return;
    }

    const now = this.time.now;

    if (now < this.matchPausedUntil) {
      return;
    }

    const deltaSec = delta / 1000;

    this.updateMatchTimer(deltaSec);
    if (this.matchState.isMatchOver) {
      return;
    }

    this.updateTeamPower();

    this.players.forEach((player) => {
      const teammates = this.playersByTeam[player.team];
      const opponents = this.playersByTeam[player.team === 'home' ? 'away' : 'home'];
      player.update(this, delta, this.ball, teammates, opponents, this.teamPower[player.team]);
    });

    this.ball.update(deltaSec);

    this.handleBallPossession();
    this.trackPossession(deltaSec);
    this.handleGoalDetection();
  }

  createMatchState() {
    return {
      timeRemaining: MATCH_DURATION,
      isPaused: false,
      homeScore: 0,
      awayScore: 0,
      homePossessionTime: 0,
      awayPossessionTime: 0,
      homeShots: 0,
      awayShots: 0,
      homePasses: 0,
      awayPasses: 0,
      homePassesCompleted: 0,
      awayPassesCompleted: 0,
      isMatchOver: false,
      lastGoalTeam: null
    };
  }

  drawField() {
    const graphics = this.add.graphics();

    graphics.fillStyle(TEAM_COLORS.pitch, 1);
    graphics.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    graphics.lineStyle(2, TEAM_COLORS.line, 1);
    graphics.strokeRect(5, 5, FIELD_WIDTH - 10, FIELD_HEIGHT - 10);
    graphics.lineBetween(FIELD_WIDTH / 2, 0, FIELD_WIDTH / 2, FIELD_HEIGHT);
    graphics.strokeCircle(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 75);

    graphics.strokeRect(0, (FIELD_HEIGHT - 180) / 2, 120, 180);
    graphics.strokeRect(FIELD_WIDTH - 120, (FIELD_HEIGHT - 180) / 2, 120, 180);

    graphics.fillStyle(0xffffff, 0.25);
    graphics.fillRect(0, (FIELD_HEIGHT - GOAL_WIDTH) / 2, GOAL_DEPTH, GOAL_WIDTH);
    graphics.fillRect(FIELD_WIDTH - GOAL_DEPTH, (FIELD_HEIGHT - GOAL_WIDTH) / 2, GOAL_DEPTH, GOAL_WIDTH);
  }

  createTeams() {
    this.createTeam('home', FORMATION_1_2_2_2.home);
    this.createTeam('away', FORMATION_1_2_2_2.away);
  }

  createTeam(team, formation) {
    formation.forEach((position, index) => {
      const ranges = position.isGoalkeeper ? STAT_RANGES.goalkeeper : STAT_RANGES.fieldPlayer;
      const player = new Player(this, {
        id: `${team}-${index}`,
        team,
        x: position.x,
        y: position.y,
        formationX: position.x,
        formationY: position.y,
        isGoalkeeper: position.isGoalkeeper,
        role: position.role,
        speed: randomInt(ranges.speed[0], ranges.speed[1]),
        attack: randomInt(ranges.attack[0], ranges.attack[1]),
        defense: randomInt(ranges.defense[0], ranges.defense[1]),
        stamina: randomInt(ranges.stamina[0], ranges.stamina[1])
      });

      this.players.push(player);
      this.playersByTeam[team].push(player);
    });
  }

  createHud() {
    this.scoreText = this.add.text(FIELD_WIDTH / 2, 16, '', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.timerText = this.add.text(FIELD_WIDTH - 16, 18, '', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(1, 0);

    this.statusText = this.add.text(16, 18, 'AI vs AI', {
      fontSize: '20px',
      color: '#e2e8f0'
    });
  }

  updateTeamPower() {
    this.teamPower.home = calculateTeamPower(this.playersByTeam.home);
    this.teamPower.away = calculateTeamPower(this.playersByTeam.away);
  }

  handleBallPossession() {
    if (this.ball.owner) {
      return;
    }

    const now = this.time.now;
    if (now - this.lastPossessionSwapAt < POSSESSION_COOLDOWN_MS) {
      return;
    }

    for (const player of this.players) {
      if (isCircleCollision(player.x, player.y, player.radius, this.ball.x, this.ball.y, PLAYER_REACH)) {
        this.ball.setOwner(player);
        this.lastPossessionSwapAt = now;
        break;
      }
    }
  }

  handleGoalDetection() {
    const inGoalY = this.ball.y > (FIELD_HEIGHT - GOAL_WIDTH) / 2 && this.ball.y < (FIELD_HEIGHT + GOAL_WIDTH) / 2;

    if (!inGoalY) {
      return;
    }

    if (this.ball.x <= GOAL_DEPTH) {
      this.registerGoal('away');
    } else if (this.ball.x >= FIELD_WIDTH - GOAL_DEPTH) {
      this.registerGoal('home');
    }
  }

  registerGoal(scoringTeam) {
    this.matchState[`${scoringTeam}Score`] += 1;
    this.matchState.lastGoalTeam = scoringTeam;
    this.updateScoreboard();

    this.statusText.setText(`${scoringTeam.toUpperCase()} GOAL! Kickoff resetting...`);

    this.players.forEach((player) => {
      player.x = player.formationX;
      player.y = player.formationY;
      player.hasBall = false;
      player.render();
    });

    this.ball.resetToCenter();
    this.matchPausedUntil = this.time.now + 2000;
  }

  updateMatchTimer(deltaSec) {
    this.matchState.timeRemaining = Math.max(0, this.matchState.timeRemaining - deltaSec);
    this.updateTimerText();

    if (this.matchState.timeRemaining <= 0) {
      this.matchState.isMatchOver = true;
      this.showMatchEndOverlay();
    }
  }

  updateScoreboard() {
    this.scoreText.setText(`HOME ${this.matchState.homeScore} - ${this.matchState.awayScore} AWAY`);
  }

  updateTimerText() {
    const totalSeconds = Math.ceil(this.matchState.timeRemaining);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.timerText.setText(`${minutes}:${String(seconds).padStart(2, '0')}`);
  }

  trackPossession(deltaSec) {
    if (!this.ball.owner) {
      return;
    }

    this.matchState[`${this.ball.owner.team}PossessionTime`] += deltaSec;
  }

  getGoalkeeper(team) {
    return this.playersByTeam[team].find((player) => player.isGoalkeeper) || null;
  }

  showMatchEndOverlay() {
    this.statusText.setText('MATCH OVER');

    const bg = this.add.rectangle(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 620, 360, 0x000000, 0.8);
    bg.setDepth(10);

    const homePossessionPercent = this.calculatePossessionPercent('home');
    const awayPossessionPercent = this.calculatePossessionPercent('away');

    const statsText = [
      'FINAL SCORE',
      `HOME ${this.matchState.homeScore} - ${this.matchState.awayScore} AWAY`,
      '',
      `Shots: ${this.matchState.homeShots} - ${this.matchState.awayShots}`,
      `Possession: ${homePossessionPercent}% - ${awayPossessionPercent}%`,
      `Passes Completed: ${this.matchState.homePassesCompleted}/${this.matchState.homePasses} - ${this.matchState.awayPassesCompleted}/${this.matchState.awayPasses}`,
      '',
      'Restart Match'
    ];

    const text = this.add.text(FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 130, statsText.join('\n'), {
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5, 0).setDepth(11);

    const restartButton = this.add.rectangle(FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 135, 260, 56, 0x2563eb, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(11);

    const restartLabel = this.add.text(FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 135, 'Restart Match', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(12);

    restartButton.on('pointerover', () => restartButton.setFillStyle(0x1d4ed8));
    restartButton.on('pointerout', () => restartButton.setFillStyle(0x2563eb));
    restartButton.on('pointerdown', () => this.scene.restart());

    this.overlayElements = [bg, text, restartButton, restartLabel];
  }

  calculatePossessionPercent(team) {
    const total = this.matchState.homePossessionTime + this.matchState.awayPossessionTime;
    if (total <= 0) {
      return 50;
    }

    return Math.round((this.matchState[`${team}PossessionTime`] / total) * 100);
  }
}
