import { t } from "elysia";
import { create_target } from "./types";

const discord_target = create_target({
  id: "discord",
  async fn(data) {
    const res = await fetch(data.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data.data),
    });
    console.log(res.status, await res.text());
    if (!res.ok) throw res;
  },
  Type: t.Object(
    {
      url: t.String({ format: "uri", pattern: "^https://discord.com/api/webhooks/" }),
      data: t.Any(),
    },
    { additionalProperties: false },
  ),
});
export default discord_target;
