export class HandleTelegramUpdate {
  constructor({ getWeatherForecast, telegramGateway }) {
    this.getWeatherForecast = getWeatherForecast;
    this.telegramGateway = telegramGateway;
  }

  async execute(update) {
    const message = update?.message;
    if (!message?.chat?.id || typeof message.text !== 'string') return;

    const city = message.text.replace(/^\/weather\s*/i, '').trim();
    const text = message.text.startsWith('/start')
      ? 'Привет! Напишите название города, и я пришлю прогноз погоды на три дня.\n\nНапример: Москва или Saint Petersburg.'
      : (await this.getWeatherForecast.execute(city)).text;

    await this.telegramGateway.sendMessage(message.chat.id, text);
  }
}
