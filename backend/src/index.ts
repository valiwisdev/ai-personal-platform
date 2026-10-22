import { buildApp } from "./app.ts";
import { createDatabase } from "./db/index.ts";

const { db, pool } = createDatabase();
const app = await buildApp({
  db,
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});

pool.on("error", (error) => app.log.error(error));
app.addHook("onClose", async () => {
  await pool.end();
});

async function close() {
  try {
    await app.close();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void close();
  });
}

try {
  await app.listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await close();
}
