from oven/bun:1-alpine as base
run mkdir /app && chown bun /app
workdir /app

from base as install
run mkdir -p /temp/dev
copy package.json bun.lock /temp/dev/
run cd /temp/dev && bun install --frozen-lockfile

from base as build
copy --from=install /temp/dev/node_modules node_modules
copy . .
env NODE_ENV=production
run bun bundle

from base as release
copy --from=build --chown=bun /app/out ./

env NODE_ENV=production
user bun
# entrypoint ["ls", "-al"]
entrypoint ["bun", "run", "index.js"]