import { buildApp } from './infrastructure/http/build-app.js';

const app = buildApp();
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server is listening on ${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
