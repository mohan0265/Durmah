// netlify/functions/api.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import awsLambdaFastify from "@fastify/aws-lambda";

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });

app.get("/healthz", async () => {
  return {
    ok: true,
    service: "durmah-api",
    ts: new Date().toISOString()
  };
});

// Example placeholder for future routes
// app.post("/transcripts", async (req, reply) => {
//   return { saved: true };
// });

export const handler = awsLambdaFastify(app);
