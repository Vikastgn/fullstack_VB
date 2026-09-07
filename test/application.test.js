import test from 'node:test';
import assert from 'node:assert/strict';
import { GetWeatherForecast } from '../src/application/get-weather-forecast.js';
import { buildApp } from '../src/infrastructure/http/build-app.js';

test('formats current weather and a three-day forecast', async () => {
  const useCase = new GetWeatherForecast({ weatherProvider: { getForecast: async (city) => {
    assert.equal(city, 'Москва');
    return {
      city: 'Москва', current: { temperature: 12.4, weatherCode: 2 },
      days: [
        { date: '2026-09-07', minTemperature: 8.1, maxTemperature: 15.9, weatherCode: 61 },
        { date: '2026-09-08', minTemperature: 7, maxTemperature: 16, weatherCode: 0 },
        { date: '2026-09-09', minTemperature: 9, maxTemperature: 17, weatherCode: 3 }
      ]
    };
  } } });
  const result = await useCase.execute('Москва');
  assert.match(result.text, /Сейчас в Москва: 12°C, переменная облачность/);
  assert.match(result.text, /7 сент\.: 8°C…16°C, небольшой дождь/);
});

test('asks for a city when no city is supplied', async () => {
  const useCase = new GetWeatherForecast({ weatherProvider: {} });
  assert.match((await useCase.execute('')).text, /название города/);
});

test('health endpoint works and webhook rejects an invalid secret', async (t) => {
  const app = buildApp({ env: { TELEGRAM_WEBHOOK_SECRET: 'expected' } });
  t.after(() => app.close());

  assert.equal((await app.inject({ method: 'GET', url: '/health' })).statusCode, 200);
  assert.equal((await app.inject({
    method: 'POST', url: '/telegram/webhook/wrong', payload: {}
  })).statusCode, 401);
});
