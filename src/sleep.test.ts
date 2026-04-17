import { describe, expect, test } from "bun:test";

import { sleep } from "./sleep";

describe("sleep", () => {
  test("resolves immediately when delay is zero or less", async () => {
    const startedAt = performance.now();

    await sleep(0);

    const elapsedMs = performance.now() - startedAt;
    expect(elapsedMs).toBeLessThan(5);
  });

  test("resolves after roughly the requested delay", async () => {
    const delayMs = 25;
    const startedAt = performance.now();

    await sleep(delayMs);

    const elapsedMs = performance.now() - startedAt;
    expect(elapsedMs).toBeGreaterThanOrEqual(delayMs - 1);
    expect(elapsedMs).toBeLessThan(250);
  });

  test("resolves early when aborted", async () => {
    const controller = new AbortController();
    const startedAt = performance.now();
    const abortAfterMs = 15;
    const requestedDelayMs = 100;

    setTimeout(() => controller.abort(), abortAfterMs);
    await sleep(requestedDelayMs, { signal: controller.signal });

    const elapsedMs = performance.now() - startedAt;
    expect(elapsedMs).toBeGreaterThanOrEqual(abortAfterMs - 1);
    expect(elapsedMs).toBeLessThan(requestedDelayMs);
  });
});
