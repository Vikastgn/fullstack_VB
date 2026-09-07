import { buildApp } from '../src/infrastructure/http/build-app.js';

const app = buildApp();

export default async function handler(request, response) {
  await app.ready();
  app.server.emit('request', request, response);
}
