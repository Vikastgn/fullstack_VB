import Fastify from 'fastify';
import { GetWeatherForecast } from '../../application/get-weather-forecast.js';
import { HandleTelegramUpdate } from '../../application/handle-telegram-update.js';
import { OpenMeteoWeatherProvider } from '../weather/open-meteo-weather-provider.js';
import { TelegramBotApiGateway } from '../telegram/telegram-bot-api-gateway.js';

export function buildApp({ env = process.env } = {}) {
  const app = Fastify({ logger: true });
  const getWeatherForecast = new GetWeatherForecast({
    weatherProvider: new OpenMeteoWeatherProvider({})
  });
  const handleTelegramUpdate = new HandleTelegramUpdate({
    getWeatherForecast,
    telegramGateway: new TelegramBotApiGateway({ token: env.TELEGRAM_BOT_TOKEN })
  });

  app.get('/health', async () => ({ status: 'ok' }));
  app.post('/telegram/webhook/:secret', async (request, reply) => {
    if (!env.TELEGRAM_WEBHOOK_SECRET || request.params.secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    try {
      await handleTelegramUpdate.execute(request.body);
    } catch (error) {
      request.log.error(error, 'Cannot process Telegram update');
      // Telegram retries non-2xx updates; acknowledge it to prevent retry storms.
    }
    return reply.code(200).send({ ok: true });
  });

  return app;
}
