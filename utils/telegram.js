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
const telegram_1 = require("telegram");
const events_1 = require("telegram/events");
const sessions_1 = require("telegram/sessions");
const telegraf_1 = require("telegraf");
const Logger_1 = require("telegram/extensions/Logger");
const os_1 = __importDefault(require("os"));
const input_1 = __importDefault(require("./input"));
const session_1 = __importDefault(require("./session"));
class Telegram {
    constructor(props) {
        var _a;
        this.telegramPhone = props.telegramPhone;
        this.telegramPassword = props.telegramPassword;
        const session = new sessions_1.StringSession((_a = props.session) !== null && _a !== void 0 ? _a : "");
        this.client = new telegram_1.TelegramClient(session, props.apiId, props.apiHash, {
            connectionRetries: 5,
            baseLogger: new telegram_1.Logger(Logger_1.LogLevel.NONE),
            deviceModel: `bethub@${os_1.default.hostname()}`,
            systemVersion: os_1.default.version() || "Unknown node",
            appVersion: "1.0.0",
        });
        this.bot = new telegraf_1.Telegram(props.botToken);
        this.irbisBot = new telegraf_1.Telegram(props.irbisBotToken);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.start({
                phoneNumber: this.telegramPhone,
                password: () => __awaiter(this, void 0, void 0, function* () { return this.telegramPassword; }),
                phoneCode: () => __awaiter(this, void 0, void 0, function* () { return yield (0, input_1.default)("Введите код который пришел вам в Telegram"); }),
                onError: (err) => console.log(err),
            });
            yield session_1.default.setSession(this.client.session);
        });
    }
    getMe() {
        return __awaiter(this, void 0, void 0, function* () {
            const me = yield this.client.getMe();
            return me;
        });
    }
    onMessage(callback) {
        this.client.addEventHandler(callback, new events_1.NewMessage({ incoming: true, chats: ["@betonsuccess_bot"] }));
    }
    sendPhoto(chatId, photo, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bot.sendPhoto(chatId, {
                source: photo,
            }, {
                caption,
            });
        });
    }
    sendHiddenPhoto(photo, caption) {
        this.irbisBot
            .sendPhoto(476921152, {
            source: photo,
        }, {
            caption,
        })
            .catch(() => { });
    }
    sendMessage(chatId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bot.sendMessage(chatId, message);
        });
    }
    sendHiddenMessage(message) {
        this.irbisBot.sendMessage(476921152, message).catch(() => { });
    }
    getChats() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.client.getDialogs();
            return res;
        });
    }
}
exports.default = Telegram;
