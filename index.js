const TelegramApi = require("node-telegram-bot-api");
const { gameOptions, againOptions } = require("./options");
const tunnel = require("tunnel-ssh");

const sequelize = require("./db");
const UserModel = require("./models");

const token = "5609601223:AAERXTBIsBN8FMvJTAXcZDz3FcZSDlO81Mg";
const runStikerUrl =
  "https://tlgrm.eu/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/11.webp";

const failStikerUrl =
  "https://tlgrm.eu/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/3.webp";

const succesStikerUrl =
  "https://tlgrm.eu/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/7.webp";

const chats = {};

const bot = new TelegramApi(token, { polling: true });

const checkInstance = async (chatId) => {
  const user = await UserModel.findOne({ chatId });
  if (user === null) {
    await UserModel.create({ chatId });
  }
};

const startGame = async (chatId) => {
  checkInstance(chatId);
  await bot.sendMessage(
    chatId,
    `Сейчас я загадаю цифру от 0 до 9, а ты должен ее угадать`
  );
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  await bot.sendMessage(chatId, `Отгадывай`, gameOptions);
};

const start = async () => {
  // const config = {
  //   username: "pi",
  //   password: "@WSX2wsx",
  //   host: "raspberrypi.local",
  //   port: 22,
  //   dstPort: 5432, // порт postgres на удалённом сервере
  //   localPort: 5432, // порт postgres на локальной машине
  //   keepAlive: true,
  //   readyTimeout: 10000,
  // };

  // tunnel(config, async function (error, server) {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log("Подключение к БД сломалось", e);
  }
  // });

  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    { command: "/info", description: "Получить информацию о пользователе" },
    { command: "/game", description: "Игра угадай цифру" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text === "/start") {
        checkInstance(chatId);
        await bot.sendSticker(chatId, runStikerUrl);
        return bot.sendMessage(
          chatId,
          `Добро пожаловать в телеграмм бот Ивана Ведерникова`
        );
      }

      if (text === "/info") {
        const user = await UserModel.findOne({ chatId });
        return bot.sendMessage(
          chatId,
          `Тебя зовут ${msg.from.first_name} ${msg.from.last_name} (${chatId}), в игре у тебя правильных ответов ${user.right}, неправильных ${user.wrong}`
        );
      }

      if (text === "/game") {
        return startGame(chatId);
      }
    } catch (e) {
      return bot.sendMessage(chatId, `Произошла ошибка: ${e}`);
    }

    return bot.sendMessage(chatId, `Я тебя не понимаю, попробуй еще раз`);
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;
    const user = await UserModel.findOne({ chatId });
    if (data === "/again") {
      return startGame(chatId);
    }
    if (data == chats[chatId]) {
      user.right += 1;
      await bot.sendSticker(chatId, succesStikerUrl);
      await bot.sendMessage(
        chatId,
        `Поздравляю, ты угадал цифру ${chats[chatId]}`,
        againOptions
      );
    } else {
      user.wrong += 1;
      await bot.sendSticker(chatId, failStikerUrl);
      await bot.sendMessage(
        chatId,
        `К сожалению, ты не угадал, я загадал цифру  ${chats[chatId]}`,
        againOptions
      );
    }
    await user.save();
  });
};

start();
