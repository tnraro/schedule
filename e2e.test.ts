import { expect, test } from "bun:test";

test("test", async () => {
  const unix_timestamp_ms = Date.now() + 5000;
  const res = await fetch(`http://localhost:3000/test/${unix_timestamp_ms}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: "test", now: unix_timestamp_ms }),
  });

  expect(await res.text()).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(res.status).toBe(201);
});

test("delete test task", async () => {
  const unix_timestamp_ms = Date.now() + 2000;
  const create_res = await fetch(`http://localhost:3000/test/${unix_timestamp_ms}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: "delete", now: unix_timestamp_ms }),
  });

  const task_id = await create_res.text();

  expect(task_id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(create_res.status).toBe(201);

  const delete_res = await fetch(`http://localhost:3000/test/${unix_timestamp_ms}/${task_id}`, {
    method: "DELETE",
  });

  expect(delete_res.status).toBe(200);
});

test.skip("loop", async () => {
  const x = Date.now() + 2000;
  for (let j = 0; j < 5; j++) {
    const unix_timestamp_ms = x + j * 200;
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`http://localhost:3000/test/${unix_timestamp_ms}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: `loop ${String(j).padStart(3)} ${String(i).padStart(3)}`,
          now: unix_timestamp_ms,
        }),
      });
      expect(res.ok).toBe(true);
    }
  }
});
