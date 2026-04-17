import { t } from "elysia";
import { create_target } from "./types";

const test_target = create_target({
  id: "test",
  async fn(data) {
    const now = Date.now();
    console.info("TEST", data.id, now - data.now);
  },
  Type: t.Object({
    id: t.Any(),
    now: t.Number(),
  }),
});
export default test_target;
