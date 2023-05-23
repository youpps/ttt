import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import config from "./configs/appConfig.json";
import IConfig from "./types/config";
import Session from "./utils/session";
import Telegram from "./utils/telegram";
import randomUseragent from "random-useragent";
import { Browser } from "puppeteer";

const irbisBotToken = "6120857007:AAFKLS_yfOcPCltrCU-y-uXCnUNTvyGmIjU";

async function bootstrap() {
  try {
    const { apiId, apiHash, telegramPhone, telegramPassword, bethubLogin, bethubPassword, privateers, botToken, twoCaptchaToken } = config as IConfig;

    puppeteer.use(StealthPlugin());
    puppeteer.use(
      RecaptchaPlugin({
        provider: {
          id: "2captcha",
          token: twoCaptchaToken, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
        },
        visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
      })
    );

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

    const page = await createPage(browser, "https://bet-hub.com/");

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

        const newPage = await createPage(browser, privateerObj.url);
        const showButtons = await newPage.$$(".button_general");

        for (let button of showButtons) {
          await button.click({ delay: 300 });
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

async function createPage(browser: Browser, url: string) {
  //Randomize User agent or Set a valid one
  // const userAgent = randomUseragent.getRandom();
  // const UA = userAgent || USER_AGENT;
  const page = await browser.newPage();

  //Randomize viewport size
  await page.setViewport({
    height: 1080,
    width: 1920,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  await page.setUserAgent(randomUseragent.getRandom());
  await page.setJavaScriptEnabled(true);
  page.setDefaultNavigationTimeout(0);

  await page.evaluateOnNewDocument(() => {
    // Pass webdriver check
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  await page.evaluateOnNewDocument(() => {
    // Pass chrome check
    (window as any).chrome = {
      runtime: {},
      // etc.
    };
  });

  await page.evaluateOnNewDocument(() => {
    //Pass notifications check
    const originalQuery = window.navigator.permissions.query as any;
    return (window.navigator.permissions.query = (parameters: any) => (parameters.name === "notifications" ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters)));
  });

  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, "plugins", {
      // This just needs to have `length > 0` for the current test,
      // but we could mock the plugins too if necessary.
      get: () => [1, 2, 3, 4, 5],
    });
  });

  await page.evaluateOnNewDocument(() => {
    // Overwrite the `languages` property to use a custom getter.
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
  return page;
}

bootstrap();
