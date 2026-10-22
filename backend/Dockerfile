FROM oven/bun:1.4.3
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "bun run db:migrate && exec bun run dev"]
