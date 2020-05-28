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

async function chkFile(chatId) {
  const updateStatus = await setUserStatus(
    getUserFilePath(chatId),
    chatId,
    null
  );

  if (!updateStatus) {
    bot.sendMessage(chatId, texts.noAccount);
    return false;
  }

  return true;
}

async function addCategoryList(chatId, array) {
  const catList = await dbfunc.getCategory(chatId);

  for (let i = 0; i < catList.length; i++) {
    array.push([
      {
        text: catList[i].category,
        callback_data: catList[i].category,
      },
    ]);
  }
}

async function setUserStatus(path, id, status) {
  const userConfig = await readConfigFile(path);

  if (!userConfig || userConfig.result === "error") {
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
    return;
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
    const list = await dbfunc.readItem({
      inputPsn: chatId,
      category: updateStatus.CAT,
    });

    let retStr = "<b><u>단어 조회 결과</u></b>\r\n\r\n";

    list.forEach((i, idx) => {
      retStr += `${idx + 1}. ${i.name}\r\n- ${i.desc}\r\n`;
    });

    await writeConfigFile(getUserFilePath(chatId), initUser());
    bot.sendMessage(chatId, retStr, opts);
  } else {
    bot.sendMessage(chatId, texts.noAccount, opts);
    return;
  }
}

async function exam(msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const updateStatus = await setUserStatus(
    getUserFilePath(chatId),
    chatId,
    null
  );

  if (updateStatus) {
    const list = await dbfunc.readRandomItem({
      inputPsn: chatId,
      category: updateStatus.CAT,
    });

    let retStr = texts.examExplaination.replace(/{{count}}/g, list.length);

    updateStatus.STATUS = constants.STATUS.IS_EXAMING;
    updateStatus.EXAM = list;
    updateStatus.TTL_EXAM_COUNT = list.length;

    await writeConfigFile(getUserFilePath(chatId), updateStatus);
    bot.sendMessage(chatId, retStr, opts);

    issueExam(msg);
  } else {
    bot.sendMessage(chatId, texts.noAccount, opts);
    return;
  }
}

async function issueExam(msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const updateStatus = await setUserStatus(
    getUserFilePath(chatId),
    chatId,
    null
  );

  if (!updateStatus) {
    bot.sendMessage(chatId, texts.noAccount, opts);
    return;
  }

  if (updateStatus.EXAM.length == 0) {
    bot.sendMessage(
      chatId,
      `정답:${updateStatus.CURR_EXAM.desc}\r\n\r\n시험이 종료되었습니다. 수고하셨습니다.`,
      opts
    );
    await writeConfigFile(getUserFilePath(chatId), initUser());
  } else {
    let msg = "";
    if (updateStatus.CURR_EXAM_NUM != 0) {
      msg = `문제${updateStatus.CURR_EXAM_NUM} 정답:${updateStatus.CURR_EXAM.desc}\r\n\r\n`;
    }

    const curr = updateStatus.EXAM.shift();

    updateStatus.CURR_EXAM = curr;
    updateStatus.CURR_EXAM_NUM = updateStatus.CURR_EXAM_NUM + 1;

    await writeConfigFile(getUserFilePath(chatId), updateStatus);

    msg += `문제 ${updateStatus.CURR_EXAM_NUM}:${curr.name}`;

    bot.sendMessage(chatId, msg, opts);
  }
}

function initMenu(chatId) {
  const opts = {
    parse_mode: "HTML",
    reply_markup: {
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
            text: "/초기메뉴",
          },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, texts.welcome, opts);
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
          category: userConfig.CAT,
          type: "WORD",
          kind: "WORD",
          inputPsn: chatId + "",
          global: "N",
        };
        await dbfunc.insertItem(item);

        const opts = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "단어등록 종료",
                  callback_data: "endInsertWord",
                },
              ],
            ],
          },
        };

        bot.sendMessage(chatId, texts.finishRegister, opts);
      }
    } else if (userConfig.STATUS === constants.STATUS.IS_EXAMING) {
      // 시험문제 출제중
      issueExam(msg);
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

    initMenu(chatId);
  });

  bot.onText(/\/단어등록/, async (msg, match) => {
    const chatId = msg.chat.id;

    const userConfig = await readConfigFile(getUserFilePath(chatId));

    if (!userConfig || userConfig.result === "error") {
      bot.sendMessage(chatId, texts.noAccount);
      return;
    }

    const btnArray = [[{ text: "새카테고리", callback_data: "newcategory" }]];
    await addCategoryList(chatId, btnArray);

    const opts = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: btnArray,
      },
    };

    userConfig.STATUS = constants.STATUS.SEL_CAT_FOR_INSERT;
    await writeConfigFile(getUserFilePath(chatId), userConfig);

    bot.sendMessage(chatId, texts.selectCategoryForInsert, opts);
  });

  bot.onText(/\/단어조회/, async (msg, match) => {
    const chatId = msg.chat.id;

    const userConfig = await readConfigFile(getUserFilePath(chatId));

    if (!userConfig || userConfig.result === "error") {
      bot.sendMessage(chatId, texts.noAccount);
      return;
    }

    let btnArray = [];

    await addCategoryList(chatId, btnArray);

    const opts = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: btnArray,
      },
    };

    userConfig.STATUS = constants.STATUS.SEL_CAT_FOR_SELECT;
    await writeConfigFile(getUserFilePath(chatId), userConfig);

    bot.sendMessage(chatId, texts.selectCategoryForSelect, opts);
  });

  bot.onText(/\/단어수정/, async (msg, match) => {
    const chk = await chkFile(msg.chat.id);
    if (!chk) return;

    bot.sendMessage(msg.chat.id, "준비중입니다.");
  });

  bot.onText(/\/단어삭제/, async (msg, match) => {
    const chk = await chkFile(msg.chat.id);
    if (!chk) return;

    bot.sendMessage(msg.chat.id, "준비중입니다.");
  });

  bot.onText(/\/랜덤문제출제/, async (msg, match) => {
    const chatId = msg.chat.id;

    const userConfig = await readConfigFile(getUserFilePath(chatId));

    if (!userConfig || userConfig.result === "error") {
      bot.sendMessage(chatId, texts.noAccount);
      return;
    }

    let btnArray = [];

    await addCategoryList(chatId, btnArray);

    const opts = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: btnArray,
      },
    };

    userConfig.STATUS = constants.STATUS.SEL_CAT_FOR_EXAM;
    await writeConfigFile(getUserFilePath(chatId), userConfig);

    bot.sendMessage(chatId, texts.selectCategoryForExam, opts);
  });

  bot.onText(/\/초기메뉴/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userConfig = await readConfigFile(getUserFilePath(chatId));

    if (!userConfig || userConfig.result === "error") {
      bot.sendMessage(chatId, texts.noAccount);
      return;
    }

    await writeConfigFile(getUserFilePath(chatId), initUser());

    initMenu(chatId);
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
    const userConfig = await setUserStatus(
      getUserFilePath(chatId),
      chatId,
      null
    );

    if (!userConfig) {
      bot.sendMessage(chatId, texts.noAccount, opts);
      return;
    }

    if (action === "registerWord") {
      registerWord(msg);
    } else if (action === "newcategory") {
      userConfig.STATUS = constants.STATUS.NEWCATEGORY;
      await writeConfigFile(getUserFilePath(chatId), userConfig);

      bot.editMessageText("새 카테고리명을 입력하세요.\r\n ex)eng", opts);
    } else if (action === "endInsertWord") {
      userConfig.STATUS = constants.STATUS.DEFAULT;
      await writeConfigFile(getUserFilePath(chatId), userConfig);

      bot.editMessageText("단어등록 기능이 종료되었습니다.", opts);
    } else {
      if (userConfig.STATUS === constants.STATUS.SEL_CAT_FOR_INSERT) {
        // 단어 등록
        userConfig.CAT = action;
        await writeConfigFile(getUserFilePath(chatId), userConfig);

        registerWord(msg);
        bot.editMessageText(`선택된 카테고리:${action}`, opts);
      } else if (userConfig.STATUS === constants.STATUS.SEL_CAT_FOR_SELECT) {
        // 단어 조회
        userConfig.CAT = action;
        await writeConfigFile(getUserFilePath(chatId), userConfig);

        readWord(msg);
        bot.editMessageText(`선택된 카테고리:${action}`, opts);
      } else if (userConfig.STATUS === constants.STATUS.SEL_CAT_FOR_EXAM) {
        // 랜덤 문제 출제
        userConfig.CAT = action;
        await writeConfigFile(getUserFilePath(chatId), userConfig);

        exam(msg);
        bot.editMessageText(`선택된 카테고리:${action}`, opts);
      } else {
        bot.editMessageText("기타 리턴값", opts);
      }
    }
  });
};

module.exports = telBot;
