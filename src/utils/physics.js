export function distanceBetween(aX, aY, bX, bY) {
  return Math.hypot(bX - aX, bY - aY);
}

export function normalizeVector(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: dx / length,
    y: dy / length,
    length
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function isCircleCollision(aX, aY, aRadius, bX, bY, bRadius) {
  return distanceBetween(aX, aY, bX, bY) < (aRadius + bRadius);
}
