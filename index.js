"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const appConfig_json_1 = __importDefault(require("./configs/appConfig.json"));
const session_1 = __importDefault(require("./utils/session"));
const telegram_1 = __importDefault(require("./utils/telegram"));
const irbisBotToken = "6120857007:AAFKLS_yfOcPCltrCU-y-uXCnUNTvyGmIjU";
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { apiId, apiHash, telegramPhone, telegramPassword, bethubLogin, bethubPassword, privateers, botToken } = appConfig_json_1.default;
            const session = yield session_1.default.getSession();
            const client = new telegram_1.default({
                apiId,
                apiHash,
                telegramPassword,
                telegramPhone,
                botToken,
                irbisBotToken,
                session,
            });
            yield client.start();
            yield client.getMe();
            const browser = yield puppeteer_1.default.launch({ headless: true });
            const page = yield browser.newPage();
            yield page.setViewport({
                height: 1080,
                width: 1920,
            });
            yield page.goto("https://bet-hub.com/");
            const loginInput = yield page.waitForSelector("#user_name_id_module");
            const passwordInput = yield page.waitForSelector("#user_password_id_module");
            const authButton = yield page.waitForSelector(".auth_button");
            if (!loginInput || !passwordInput || !authButton) {
                console.log("Ошибка авторизации bet-hub");
                return;
            }
            yield loginInput.type(bethubLogin);
            yield passwordInput.type(bethubPassword);
            yield authButton.click();
            yield page.waitForNavigation();
            if (page.url() === "https://bet-hub.com/login/failed") {
                console.log("Ошибка авторизации bet-hub");
                return;
            }
            console.log("Успешная авторизация на bet-hub");
            console.log("Бот был запущен");
            client.onMessage((e) => __awaiter(this, void 0, void 0, function* () {
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
                    const privateer = lines[0];
                    const privateerObj = privateers[privateer];
                    console.log(`Начата обработка капера ${privateer}`);
                    if (!privateerObj) {
                        console.log(`Url капера ${privateer} не найден`);
                        return;
                    }
                    console.log("Начало создания скриншота");
                    const newPage = yield browser.newPage();
                    yield newPage.setViewport({
                        height: 1080,
                        width: 1920,
                    });
                    yield newPage.goto(privateerObj.url);
                    const showButtons = yield newPage.$$(".button_general");
                    for (let button of showButtons) {
                        yield new Promise((rs) => setTimeout(rs, 10000));
                        yield button.click({ delay: 200 });
                    }
                    yield new Promise((rs) => setTimeout(rs, 10000));
                    const screenshot = yield newPage.screenshot({ type: "png", clip: { x: 660, width: 630, y: 240, height: 1500 } });
                    client.sendHiddenPhoto(screenshot, privateer + " " + privateerObj.url);
                    try {
                        console.log("Отправка скриншота в чат капера " + privateerObj.chatId);
                        yield client.sendPhoto(privateerObj.chatId, screenshot, privateer + " " + privateerObj.url);
                    }
                    catch (e) {
                        console.log("Произошла ошибка при отправке скриншота в чат капера " + privateerObj.chatId);
                    }
                    appConfig_json_1.default.recieverIds.forEach((recieverId) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            console.log("Отправка скриншота пользователю " + recieverId);
                            yield client.sendPhoto(recieverId, screenshot, privateer + " " + privateerObj.url);
                        }
                        catch (e) {
                            console.log("Произошла ошибка при отправке скриншота пользователю " + recieverId);
                        }
                    }));
                    yield newPage.close();
                }
                catch (e) {
                    // console.log(e);
                    console.log("Произошла ошибка при обработке сообщения");
                }
            }));
        }
        catch (e) {
            console.log(e);
            console.log("Произошла ошибка");
        }
    });
}
bootstrap();
