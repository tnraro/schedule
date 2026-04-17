import { Database } from "bun:sqlite";
import { $ } from "bun"

await $`mkdir -p data`;
export const db = new Database("data/data.sqlite", {
  safeIntegers: true,
  strict: true,
});
db.run(`PRAGMA journal_mode = wal;`);

const get_user_version_query = db.query<{ user_version: bigint }, []>(`PRAGMA user_version`);
export function get_user_version() {
  return get_user_version_query.get()?.user_version ?? 0n;
}

function set_user_version(version: bigint) {
  // TODO: validation to avoid SQL injection
  db.run(`PRAGMA user_version = ${version};`);
}

switch (get_user_version()) {
  case 0n: {
    db.run(`create table tasks (
      target_id text not null,
      time_ms integer not null,
      task_id text not null,
      data jsonb not null,

      primary key (time_ms, task_id)
    ) without rowid`);
    set_user_version(1n);
  }
}
