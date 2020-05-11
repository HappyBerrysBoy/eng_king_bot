const TelegramBot = require("node-telegram-bot-api");
const config = require("../../config.json");
// const models = require("./database/models");
const constants = require("../../constants.json");
const texts = require("./ko.js");
const { dbfunc } = require("./sequelize.js");
const {
  getUserConfig,
  readConfigFile,
  writeConfigFile,
  initUser,
} = require("./commfunc.js");

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
const userfile = "./users.json";
const userpath = "./users/";

function getUserFilePath(id) {
  return userpath + id + ".json";
}

async function setUserStatus(path, id, status) {
  const userConfig = await readConfigFile(path);

  if (!userConfig) {
    return false;
  }

  if (status) {
    userConfig.STATUS = status;
    await writeConfigFile(path, userConfig);
  }

  return userConfig;
}

async function registerWord(msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const updateStatus = await setUserStatus(
    getUserFilePath(chatId),
    chatId,
    constants.STATUS.INSERT
  );

  if (updateStatus) {
    bot.sendMessage(chatId, texts.registerWord, opts);
  } else {
    bot.sendMessage(chatId, texts.noAccount, opts);
  }
}

async function readWord(msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const updateStatus = await setUserStatus(
    getUserFilePath(chatId),
    chatId,
    null
  );

  if (updateStatus) {
    const list = await dbfunc.readItem({ inputPsn: chatId });

    let retStr = "<b><u>단어 조회 결과</u></b>\r\n\r\n";

    list.forEach((i, idx) => {
      retStr += `${idx + 1}. ${i.name}\r\n- ${i.desc}\r\n`;
    });
    bot.sendMessage(chatId, retStr, opts);
  } else {
    bot.sendMessage(chatId, texts.noAccount, opts);
  }
}

const telBot = () => {
  bot.onText(/\/help/, (m) => {
    bot.sendMessage(m.chat.id, texts.help, { parse_mode: "HTML" });
  });

  // 항상 여기는 같이 타게 되어 있음
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    const userConfig = await setUserStatus(
      getUserFilePath(chatId),
      chatId,
      null
    );

    if (!userConfig) return;

    if (userConfig.STATUS === constants.STATUS.INSERT) {
      console.log(`단어등록 상태 msgid:${msg.message_id}, text:${msg.text}`);
      const wordDesc = msg.text.split("-");

      if (wordDesc.length != 2) {
        bot.sendMessage(chatId, texts.notFitFormat, { parse_mode: "HTML" });
        return;
      } else {
        const item = {
          name: wordDesc[0].trim(),
          desc: wordDesc[1].trim(),
          cat: userConfig.CAT,
          type: "WORD",
          kind: "WORD",
          inputPsn: chatId + "",
          global: "N",
        };
        await dbfunc.insertItem(item);

        userConfig.STATUS = constants.STATUS.DEFAULT;
        await writeConfigFile(getUserFilePath(chatId), userConfig);

        bot.sendMessage(chatId, texts.finishRegister);
      }
    } else if (userConfig.STATUS === constants.STATUS.READ) {
    } else if (userConfig.STATUS === constants.STATUS.NEWCATEGORY) {
      if (msg.text.trim().length == 0) return;
      if (msg.text.trim().length > 99) {
        bot.sendMessage(chatId, texts.catToLong);
        return;
      }

      userConfig.CAT = msg.text;

      console.log(`Selected Category:${msg.text}`);
      await writeConfigFile(getUserFilePath(chatId), userConfig);

      bot.sendMessage(chatId, texts.catRegOk);

      registerWord(msg);
    } else {
      console.log(
        `아무것도 아닌상태 msgid:${msg.message_id}, text:${msg.text}`
      );
    }
  });

  bot.onText(/\/start/, async (msg, match) => {
    const chatId = msg.chat.id;

    const userConfig = await readConfigFile(getUserFilePath(chatId));

    if (!userConfig) {
      await writeConfigFile(getUserFilePath(chatId), initUser());
    } else if (userConfig.error === "error") {
      bot.sendMessage(chatId, texts.errormsg, opts);
    } else {
      userConfig.STATUS = constants.STATUS.DEFAULT;
      await writeConfigFile(getUserFilePath(chatId), userConfig);
    }

    const opts = {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
      reply_markup: {
        resize_keyboard: false,
        one_time_keyboard: true,
        keyboard: [
          [
            {
              text: "/단어등록",
            },
            {
              text: "/단어조회",
            },
          ],
          [
            {
              text: "/단어수정",
            },
            {
              text: "/단어삭제",
            },
          ],
          [
            {
              text: "/랜덤문제출제",
            },
            {
              text: "/생각중",
            },
          ],
        ],
      },
    };

    bot.sendMessage(chatId, texts.welcome, opts);
  });

  bot.onText(/\/단어등록/, async (msg, match) => {
    const chatId = msg.chat.id;
    const catList = await dbfunc.getCategory(chatId);

    const btnArray = [{ text: "새카테고리", callback_data: "newcategory" }];

    for (let i = 0; i < catList.length; i++) {
      btnArray.push({
        text: catList[i].category,
        callback_data: catList[i].category,
      });
    }

    const opts = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [btnArray],
      },
    };

    bot.sendMessage(chatId, texts.selectCategory, opts);
  });

  bot.onText(/\/단어조회/, async (msg, match) => {
    readWord(msg);
  });

  bot.onText(/\/단어수정/, async (msg, match) => {
    bot.sendMessage(msg.chat.id, "준비중입니다.");
  });

  bot.onText(/\/단어삭제/, async (msg, match) => {
    bot.sendMessage(msg.chat.id, "준비중입니다.");
  });

  bot.onText(/\/랜덤문제출제/, async (msg, match) => {
    bot.sendMessage(msg.chat.id, "준비중입니다.");
  });

  bot.onText(/\/생각중/, async (msg, match) => {
    bot.sendMessage(msg.chat.id, "준비중입니다.");
  });

  // Handle callback queries
  bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const opts = {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: "HTML",
    };
    let text;

    if (action === "registerWord") {
      registerWord(msg);
    } else if (action === "newcategory") {
      const updateStatus = await setUserStatus(
        getUserFilePath(chatId),
        chatId,
        constants.STATUS.NEWCATEGORY
      );

      if (updateStatus) {
        bot.editMessageText("새 카테고리명을 입력하세요.\r\n ex)eng", opts);
      } else {
        bot.editMessageText(texts.noAccount, opts);
      }
    } else if (action === "gotowork") {
      text = "오늘도 즐거운 하루!";
      bot.editMessageText(text, opts);
    } else if (action === "outWork") {
      text = "고생하세요!!";
      bot.editMessageText(text, opts);
    } else if (action === "businessTrip") {
      text = "차조심!!";
      bot.editMessageText(text, opts);
    } else if (action === "workInHouse") {
      text = "밥잘챙겨드세요!!";
      bot.editMessageText(text, opts);
    } else if (action === "off") {
      text = "즐거운시간 보내세요!!";
      bot.editMessageText(text, opts);
    } else if (action === "study") {
      text = "열공하세요!!";
      bot.editMessageText(text, opts);
    } else {
      text = "기타 리턴값";
      bot.editMessageText(text, opts);
    }
  });

  bot.onText(/\/btn/, function onLoveText(msg) {
    const opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        resize_keyboard: false,
        one_time_keyboard: true,
        selective: true,
        keyboard: [
          [
            {
              text: "/연차",
              callback_data: "off",
            },
          ],
          [
            {
              text: "/교육",
              callback_data: "study",
            },
          ],
          [
            {
              text: "/출근",
              callback_data: "qq",
            },
            {
              text: "/퇴근",
              callback_data: "ww",
            },
          ],
        ],
      },
    };
    bot.sendMessage(msg.chat.id, "메뉴를 선택해주세요", opts);
  });

  bot.onText(/\/btn2/, function onLoveText(msg) {
    const opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [["111"], ["222"]],
      },
    };
    // bot.sendMessage(msg.chat.id, "btn2", opts);
  });

  // Matches /audio
  bot.onText(/audio/, function onAudioText(msg) {
    // From HTTP request
    const url =
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg";
    const audio = request(url);
    bot.sendAudio(msg.chat.id, audio);
  });

  bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = "메아리: " + match[1];

    bot.sendMessage(chatId, resp);
  });

  bot.onText(/\/출근/, (msg, match) => {
    const chatId = msg.btnchat.id;

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "출근처리",
              callback_data: "gotowork",
            },
            {
              text: "외근",
              callback_data: "outWork",
            },
            {
              text: "출장",
              callback_data: "businessTrip",
            },
            {
              text: "재택",
              callback_data: "workInHouse",
            },
          ],
          [
            {
              text: "연차",
              callback_data: "off",
            },
            {
              text: "교육",
              callback_data: "study",
            },
          ],
        ],
      },
    };

    bot.sendMessage(chatId, "근태관리", opts);
  });
};

module.exports = telBot;
