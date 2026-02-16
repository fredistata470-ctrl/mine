import { clamp, randomRange } from './physics.js';

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateTeamPower(players) {
  const avgAttack = average(players.map((player) => player.attack));
  const avgDefense = average(players.map((player) => player.defense));
  const avgStamina = average(players.map((player) => player.stamina));
  const randomVariance = randomRange(-10, 10);

  return (avgAttack * 0.4) + (avgDefense * 0.3) + (avgStamina * 0.2) + randomVariance;
}

export function applyTeamPowerModifier(player, teamPower) {
  const modifier = (teamPower - 70) / 100;

  return {
    effectiveSpeed: clamp(player.speed * (1 + modifier * 0.1), 20, 120),
    effectiveAttack: clamp(player.attack * (1 + modifier * 0.15), 20, 120),
    effectiveDefense: clamp(player.defense * (1 + modifier * 0.15), 20, 120)
  };
}
