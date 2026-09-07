import { describeWeather, formatTemperature } from '../domain/weather.js';

export class GetWeatherForecast {
  constructor({ weatherProvider }) {
    this.weatherProvider = weatherProvider;
  }

  async execute(city) {
    if (!city) return { text: 'Напишите название города, например: Москва.' };

    const forecast = await this.weatherProvider.getForecast(city);
    if (!forecast) return { text: `Не удалось найти город «${city}». Попробуйте написать его иначе.` };

    const current = `Сейчас в ${forecast.city}: ${formatTemperature(forecast.current.temperature)}, ${describeWeather(forecast.current.weatherCode)}.`;
    const days = forecast.days.map((day) =>
      `${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(`${day.date}T12:00:00`))}: ${formatTemperature(day.minTemperature)}…${formatTemperature(day.maxTemperature)}, ${describeWeather(day.weatherCode)}`
    );
    return { text: [current, '', 'Прогноз:', ...days].join('\n') };
  }
}
