import { buildServer } from './app';

async function start() {
  const server = await buildServer();
  const port = parseInt(process.env.PORT || '8080', 10);
  await server.listen({ port, host: '0.0.0.0' });
  server.log.info(`Server running on http://localhost:${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
