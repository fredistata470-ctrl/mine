export const FIELD_WIDTH = 1200;
export const FIELD_HEIGHT = 720;
export const MATCH_DURATION = 180;

export const GOAL_WIDTH = 80;
export const GOAL_DEPTH = 20;
export const GOAL_HOME_X = 0;
export const GOAL_AWAY_X = FIELD_WIDTH;

export const PLAYER_RADIUS = 24;
export const GOALKEEPER_RADIUS = 28;
export const BALL_RADIUS = 8;

export const PLAYER_REACH = PLAYER_RADIUS + BALL_RADIUS + 2;
export const POSSESSION_COOLDOWN_MS = 400;

export const SHOOTING_RANGE = 160;
export const PASSING_PRESSURE_RANGE = 70;
export const PASS_PROBABILITY_WHEN_PRESSURED = 0.55;

export const BALL_FRICTION = 0.98;
export const BALL_STOP_THRESHOLD = 8;
export const BALL_POWER_SCALE = 2.4;
export const BALL_HOMING_STRENGTH = 0.18;

export const MAX_STAMINA = 100;
export const STAMINA_DRAIN_PER_SECOND = 2.3;
export const STAMINA_RECOVERY_PER_SECOND = 3.5;

export const AI_DECISION_INTERVAL_MS = 220;

export const TEAM_COLORS = {
  home: 0x1976d2,
  away: 0xd32f2f,
  ballOwnerRing: 0xffeb3b,
  pitch: 0x2e7d32,
  line: 0xffffff
};

export const STAT_RANGES = {
  fieldPlayer: {
    speed: [70, 90],
    attack: [60, 85],
    defense: [60, 85],
    stamina: [100, 100]
  },
  goalkeeper: {
    speed: [40, 60],
    attack: [30, 50],
    defense: [80, 95],
    stamina: [100, 100]
  }
};
