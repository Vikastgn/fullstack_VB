import "@supabase/functions-js/edge-runtime.d.ts";

const WEATHER_CODES: Record<number, string> = {
  0: "ясно", 1: "преимущественно ясно", 2: "переменная облачность", 3: "пасмурно",
  45: "туман", 48: "изморозь", 51: "лёгкая морось", 53: "морось", 55: "сильная морось",
  61: "небольшой дождь", 63: "дождь", 65: "сильный дождь", 71: "небольшой снег",
  73: "снег", 75: "сильный снег", 80: "ливень", 81: "ливень", 82: "сильный ливень",
  95: "гроза", 96: "гроза с градом", 99: "сильная гроза с градом",
};

type TelegramUpdate = { message?: { chat?: { id?: number }; text?: string } };

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers });

const formatTemperature = (value: number) => `${Math.round(value)}°C`;
const describeWeather = (code: number) => WEATHER_CODES[code] ?? "нет данных";

async function getWeatherForecast(city: string) {
  if (!city) return "Напишите название города, например: Москва.";

  const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodingUrl.search = new URLSearchParams({ name: city, count: "1", language: "ru", format: "json" }).toString();
  const geocodingResponse = await fetch(geocodingUrl, { signal: AbortSignal.timeout(8_000) });
  if (!geocodingResponse.ok) throw new Error(`Open-Meteo geocoding returned HTTP ${geocodingResponse.status}`);

  const location = (await geocodingResponse.json()).results?.[0];
  if (!location) return `Не удалось найти город «${city}». Попробуйте написать его иначе.`;

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.search = new URLSearchParams({
    latitude: String(location.latitude), longitude: String(location.longitude),
    current: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "3", timezone: "auto",
  }).toString();
  const forecastResponse = await fetch(forecastUrl, { signal: AbortSignal.timeout(8_000) });
  if (!forecastResponse.ok) throw new Error(`Open-Meteo forecast returned HTTP ${forecastResponse.status}`);

  const forecast = await forecastResponse.json();
  const current = `Сейчас в ${location.name}: ${formatTemperature(forecast.current.temperature_2m)}, ${describeWeather(forecast.current.weather_code)}.`;
  const days = forecast.daily.time.map((date: string, index: number) => {
    const label = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
    return `${label}: ${formatTemperature(forecast.daily.temperature_2m_min[index])}…${formatTemperature(forecast.daily.temperature_2m_max[index])}, ${describeWeather(forecast.daily.weather_code[index])}`;
  });
  return [current, "", "Прогноз:", ...days].join("\n");
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`);
}

async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.chat?.id || typeof message.text !== "string") return;

  const city = message.text.replace(/^\/weather(?:@\w+)?\s*/i, "").trim();
  const text = message.text.startsWith("/start")
    ? "Привет! Напишите название города, и я пришлю прогноз погоды на три дня.\n\nНапример: Москва или Saint Petersburg."
    : await getWeatherForecast(city);
  await sendTelegramMessage(message.chat.id, text);
}

Deno.serve(async (request) => {
  if (request.method === "GET") {
    return json({ message: "hello, it-incubator", studentId: 3116 });
  }

  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405, { Allow: "GET, POST" });
  }

  const expectedSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  const actualSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!expectedSecret || actualSecret !== expectedSecret) return json({ error: "Unauthorized" }, 401);

  try {
    await handleTelegramUpdate(await request.json());
  } catch (error) {
    console.error("Cannot process Telegram update", error);
  }

  return json({ ok: true });
});
