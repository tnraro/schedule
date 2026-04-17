import { bench, group, run, summary } from "mitata";

import { sleep } from "./sleep";

summary(() => {
  group("0ms", () => {
    bench("bun-sleep", async () => {
      await Bun.sleep(0);
    }).baseline();

    bench("custom-sleep", async () => {
      await sleep(0);
    });
  });

  group("1ms", () => {
    bench("bun-sleep", async () => {
      await Bun.sleep(1);
    }).baseline();

    bench("custom-sleep", async () => {
      await sleep(1);
    });
  });

  group("5ms", () => {
    bench("bun-sleep", async () => {
      await Bun.sleep(5);
    }).baseline();

    bench("custom-sleep", async () => {
      await sleep(5);
    });
  });
});

await run({ throw: true });
