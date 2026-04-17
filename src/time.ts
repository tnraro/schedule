export function now(): bigint {
  return BigInt(Date.now());
}

export function get_delta(x: bigint, y = now()) {
  return Number(x - y);
}
