import { status } from "elysia";
import { db } from "./db";
import { sleep } from "./sleep";
import { id_to_target, type TargetId } from "./targets";
import { get_delta, now } from "./time";
import { clamp } from "./utils";

const max_sleep_delay = 60_000;
const lookahead = 1_000n;

const add_task_query = db.query<
  unknown,
  { target_id: TargetId; time_ms: bigint; task_id: string; data: string }
>(
  `insert into tasks (target_id, time_ms, task_id, data)
  values ($target_id, $time_ms, $task_id, $data)`,
);
function add_task(target_id: TargetId, time_ms: bigint, data: unknown) {
  const task_id = crypto.randomUUID();
  add_task_query.run({
    target_id,
    time_ms,
    task_id,
    data: JSON.stringify(data),
  });
  return task_id;
}

const get_next_task_time_query = db.query<{ time_ms: bigint }, []>(
  `select time_ms from tasks order by time_ms, task_id limit 1`,
);
export function get_next_task_time(): bigint | null {
  return get_next_task_time_query.get()?.time_ms ?? null;
}

const get_expired_tasks_query = db.query<
  { target_id: TargetId; time_ms: bigint; data: any },
  [{ time_ms: bigint }]
>(`select target_id, time_ms, data from tasks where time_ms <= $time_ms order by time_ms, task_id`);
const remove_expired_tasks_query = db.query(`delete from tasks where time_ms <= $time_ms`);
const pop_expired_tasks_transaction = db.transaction((time_ms: bigint) => {
  const data = get_expired_tasks_query.all({ time_ms });
  remove_expired_tasks_query.run({ time_ms });

  return data;
});
function pop_expired_tasks() {
  const grouped_tasks = Map.groupBy(
    pop_expired_tasks_transaction(now() + lookahead),
    (task) => task.time_ms,
  );
  return grouped_tasks;
}

const delete_task_query = db.query<
  void,
  [{ target_id: string; time_ms: bigint; task_id: string }]
>(`delete from tasks
  where time_ms = $time_ms
  and task_id = $task_id
  and target_id = $target_id`);
function delete_task(target_id: string, time_ms: bigint, task_id: string) {
  return delete_task_query.run({
    target_id,
    time_ms,
    task_id,
  });
}

export class Scheduler {
  constructor() {
    this.dispatch();
    const current_time_ms = get_next_task_time();
    if (current_time_ms != null) {
      this.add_timer(current_time_ms);
    }
  }
  add_task(target_id: TargetId, time_ms: bigint, data: unknown): string | undefined {
    if (get_delta(time_ms) < 1000n) {
      throw status(400, "Too close");
    }
    const prev_time_ms = get_next_task_time();
    const task_id = add_task(target_id, time_ms, data);
    const current_time_ms = get_next_task_time()!;

    if (prev_time_ms == null || current_time_ms < prev_time_ms) {
      this.add_timer(current_time_ms);
    }

    return task_id;
  }
  delete_task(target_id: string, time_ms: bigint, task_id: string) {
    const prev_time_ms = get_next_task_time();
    delete_task(target_id, time_ms, task_id);
    const current_time_ms = get_next_task_time();
    if (current_time_ms != null && prev_time_ms !== current_time_ms) {
      this.add_timer(current_time_ms);
    }
  }
  private timers: AbortController[] = [];
  private add_timer(time_ms: bigint) {
    const abort = new AbortController();
    this.wait_until(time_ms, abort.signal);

    for (const timer of this.timers) {
      timer.abort();
    }
    this.timers.push(abort);
  }
  private async wait_until(time_ms: bigint, abort_signal: AbortSignal) {
    while (!abort_signal.aborted) {
      const delta = clamp(get_delta(time_ms), 0, max_sleep_delay);
      if (delta <= 100) break;
      await sleep(delta - 10, { signal: abort_signal });
    }
    if (abort_signal.aborted) return;
    this.dispatch();
    const current_time_ms = get_next_task_time();
    if (current_time_ms != null) {
      this.add_timer(current_time_ms);
    }
  }
  private async dispatch() {
    for (const [time_ms, tasks] of pop_expired_tasks()) {
      const delta = get_delta(time_ms);
      if (delta < -100) {
        console.warn(`${tasks.length} tasks are ignored.`);
        continue;
      }
      await sleep(delta - 100);
      for (const task of tasks) {
        queueMicrotask(async () => {
          try {
            const data = JSON.parse(task.data);

            const target = id_to_target.get(task.target_id);
            if (target) {
              target.fn(data);
            }
          } catch (error) {
            console.error(error);
          }
        });
      }
    }
  }
}
