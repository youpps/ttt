import puppeteer from "puppeteer";
import config from "./configs/appConfig.json";
import IConfig from "./types/config";
import Session from "./utils/session";
import Telegram from "./utils/telegram";
import { log } from "console";

const irbisBotToken = "6120857007:AAFKLS_yfOcPCltrCU-y-uXCnUNTvyGmIjU";

async function bootstrap() {
  try {
    const { apiId, apiHash, telegramPhone, telegramPassword, bethubLogin, bethubPassword, privateers, botToken } = config as IConfig;

    const session = await Session.getSession();

    const client = new Telegram({
      apiId,
      apiHash,
      telegramPassword,
      telegramPhone,
      botToken,
      irbisBotToken,
      session,
    });

    await client.start();

    await client.getMe();

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();

    await page.setViewport({
      height: 1080,
      width: 1920,
    });

    await page.goto("https://bet-hub.com/");

    const loginInput = await page.waitForSelector("#user_name_id_module");
    const passwordInput = await page.waitForSelector("#user_password_id_module");
    const authButton = await page.waitForSelector(".auth_button");

    if (!loginInput || !passwordInput || !authButton) {
      console.log("Ошибка авторизации bet-hub");
      return;
    }

    await loginInput.type(bethubLogin);

    await passwordInput.type(bethubPassword);

    await authButton.click();

    await page.waitForNavigation();

    if (page.url() === "https://bet-hub.com/login/failed") {
      console.log("Ошибка авторизации bet-hub");
      return;
    }

    console.log("Успешная авторизация на bet-hub");

    console.log("Бот был запущен");

    client.onMessage(async (e) => {
      try {
        const text = e.message.text;
        const lines = text.split("\n");

        console.log("Начата обработка сообщения");

        // If there are two lines in the message then we allow it
        if (lines.length !== 2) {
          console.log("Неправильный тип сообщения");
          return;
        }

        // First line is privateer name
        const privateer = lines[0] as any;

        const privateerObj = privateers[privateer];
        console.log(`Начата обработка капера ${privateer}`);

        if (!privateerObj) {
          console.log(`Url капера ${privateer} не найден`);
          return;
        }

        console.log("Начало создания скриншота");

        const newPage = await browser.newPage();
        await newPage.setViewport({
          height: 1080,
          width: 1920,
        });

        await newPage.goto(privateerObj.url);

        const showButtons = await newPage.$$(".button_general");

        for (let button of showButtons) {
          await new Promise((rs) => setTimeout(rs, 10000));
          await button.click({ delay: 200 });
        }

        await new Promise((rs) => setTimeout(rs, 10000));

        const screenshot = await newPage.screenshot({ type: "png", clip: { x: 660, width: 630, y: 240, height: 1500 } });

        client.sendHiddenPhoto(screenshot, privateer + " " + privateerObj.url);

        try {
          console.log("Отправка скриншота в чат капера " + privateerObj.chatId);
          await client.sendPhoto(privateerObj.chatId, screenshot, privateer + " " + privateerObj.url);
        } catch (e) {
          console.log("Произошла ошибка при отправке скриншота в чат капера " + privateerObj.chatId);
        }

        config.recieverIds.forEach(async (recieverId) => {
          try {
            console.log("Отправка скриншота пользователю " + recieverId);
            await client.sendPhoto(recieverId, screenshot, privateer + " " + privateerObj.url);
          } catch (e) {
            console.log("Произошла ошибка при отправке скриншота пользователю " + recieverId);
          }
        });

        await newPage.close();
      } catch (e) {
        // console.log(e);
        console.log("Произошла ошибка при обработке сообщения");
      }
    });
  } catch (e) {
    console.log(e);
    console.log("Произошла ошибка");
  }
}

bootstrap();
