import discord_target from "./discord";
import test_target from "./test";
import type { Target } from "./types";

export const targets = [
  discord_target, //
  test_target,
] as const;

export const target_ids = targets.map((t) => t.id);
export type TargetId = (typeof target_ids)[number];

export const id_to_target = new Map<TargetId, Target<TargetId, any>>();

for (const target of targets) {
  id_to_target.set(target.id, target);
}
