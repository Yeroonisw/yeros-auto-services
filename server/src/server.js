import "dotenv/config";
import { connectDatabase } from "./config/db.js";
import { createApp, ensureAdmin } from "./app.js";

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
for (const name of requiredEnv) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

async function start() {
  await connectDatabase(process.env.MONGO_URI);
  await ensureAdmin();
  const app = createApp();
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`API running at http://localhost:${port}`));
}

start().catch((error) => {
  console.error("Unable to start API:", error.message);
  process.exit(1);
});
