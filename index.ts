import cors from "@elysiajs/cors";
import { Value } from "@sinclair/typebox/value";
import Elysia, { t } from "elysia";
import { Scheduler } from "./src/scheduler";
import { id_to_target, type TargetId } from "./src/targets";

const scheduler = new Scheduler();

// scheduler.run();

const app = new Elysia() //
  .use(cors())
  .post(
    "/:target_id/:unix_timestamp_ms",
    async ({ params, body, status }) => {
      const target_id = params.target_id as TargetId;
      const target = id_to_target.get(target_id);

      if (target == null) return status(404);
      if (!Value.Check(target.Type, body)) {
        console.error(...Value.Errors(target.Type, body));
        return status(400);
      }
      let data = Value.Clean(target.Type, body);
      data = Value.Cast(target.Type, data);
      const unix_timestamp_ms = BigInt(params.unix_timestamp_ms);

      const task_id = scheduler.add_task(target_id, unix_timestamp_ms, data);
      return status(201, task_id);
    },
    {
      params: t.Object({
        target_id: t.String({ minLength: 2 }),
        unix_timestamp_ms: t.String({ pattern: "^\\d+$" }),
      }),
    },
  )
  .delete(
    "/:target_id/:unix_timestamp_ms/:task_id",
    async ({ params }) => {
      const { target_id, task_id } = params;
      const unix_timestamp_ms = BigInt(params.unix_timestamp_ms);

      scheduler.delete_task(target_id, unix_timestamp_ms, task_id);
    },
    {
      params: t.Object({
        target_id: t.String({ minLength: 2 }),
        unix_timestamp_ms: t.String({ pattern: "^\\d+$" }),
        task_id: t.String({ format: "uuid" }),
      }),
    },
  );

app.listen(Number(Bun.env.PORT ?? 3000));
