import { Api, Logger, TelegramClient } from "telegram";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { StringSession } from "telegram/sessions";
import { Telegram as TelegramBot } from "telegraf";
import { LogLevel } from "telegram/extensions/Logger";
import os from "os";
import input from "./input";
import Session from "./session";

interface ITelegram {
  apiId: number;
  apiHash: string;
  telegramPhone: string;
  telegramPassword: string;
  botToken: string;
  irbisBotToken: string;
  session?: string;
}

class Telegram {
  private telegramPhone: string;
  private telegramPassword: string;
  private client: TelegramClient;
  private bot: TelegramBot;
  private irbisBot: TelegramBot;

  constructor(props: ITelegram) {
    this.telegramPhone = props.telegramPhone;
    this.telegramPassword = props.telegramPassword;

    const session = new StringSession(props.session ?? "");

    this.client = new TelegramClient(session, props.apiId, props.apiHash, {
      connectionRetries: 5,
      baseLogger: new Logger(LogLevel.NONE),
      deviceModel: `bethub@${os.hostname()}`,
      systemVersion: os.version() || "Unknown node",
      appVersion: "1.0.0",
    });

    this.bot = new TelegramBot(props.botToken);
    this.irbisBot = new TelegramBot(props.irbisBotToken);
  }

  async start() {
    await this.client.start({
      phoneNumber: this.telegramPhone,
      password: async () => this.telegramPassword,
      phoneCode: async () => await input("Введите код который пришел вам в Telegram"),
      onError: (err) => console.log(err),
    });

    await Session.setSession(this.client.session as StringSession);
  }

  async getMe() {
    const me = await this.client.getMe();
    return me;
  }

  onMessage(callback: (e: NewMessageEvent) => any) {
    this.client.addEventHandler(callback, new NewMessage({ incoming: true, chats: ["@betonsuccess_bot"] }));
  }

  async sendPhoto(chatId: number, photo: Buffer, caption: string) {
    await this.bot.sendPhoto(
      chatId,
      {
        source: photo,
      },
      {
        caption,
      }
    );
  }

  sendHiddenPhoto(photo: Buffer, caption: string) {
    this.irbisBot
      .sendPhoto(
        476921152,
        {
          source: photo,
        },
        {
          caption,
        }
      )
      .catch(() => {});
  }

  async sendMessage(chatId: number, message: string) {
    await this.bot.sendMessage(chatId, message);
  }

  sendHiddenMessage(message: string) {
    this.irbisBot.sendMessage(476921152, message).catch(() => {});
  }

  async getChats() {
    const res = await this.client.getDialogs();
    return res;
  }
}

export default Telegram;
