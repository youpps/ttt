interface IConfig {
  apiId: number;
  apiHash: string;
  telegramPhone: string;
  telegramPassword: string;
  bethubLogin: string;
  bethubPassword: string;
  botToken: string;
  twoCaptchaToken: string;
  recieverIds: number[];
  privateers: {
    [key: string]: {
      url: string;
      chatId: number;
    };
  };
}

export default IConfig;
