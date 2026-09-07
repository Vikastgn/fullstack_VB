export class TelegramBotApiGateway {
  constructor({ token, fetchImpl = fetch }) {
    this.token = token;
    this.fetch = fetchImpl;
  }

  async sendMessage(chatId, text) {
    if (!this.token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    const response = await this.fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`);
  }
}
