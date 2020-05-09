const TelegramBot = require("node-telegram-bot-api");
const config = require("../../config.json");
// const models = require("./database/models");
const constants = require("../../constants.json");
const { dbfunc } = require("./sequelize.js");
const {
  getUserConfig,
  readConfigFile,
  writeConfigFile,
  initUser,
} = require("./commfunc.js");

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
const userfile = "./users.json";

async function registerWord(msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const userConfig = await readConfigFile(userfile);
  const targetUser = userConfig[chatId + ""];

  if (!targetUser) {
    bot.sendMessage(
      chatId,
      "등록된 계정이 없습니다. /start 명령어를 입력하여 주십시오.",
      opts
    );
    return;
  }

  targetUser.STATUS = constants.STATUS.INSERT;
  await writeConfigFile(userfile, userConfig);

  bot.sendMessage(
    chatId,
    `<b><u>단어(문장) 등록 메뉴입니다.</u></b>
입력하시려는 단어와 문장을 아래의 형태로 입력을 해주세요.

단어-문장
단어-설명

ex)apple-사과
ex)메신저-실시간으로 메시지와 데이터를 주고받을 수 있는 프로그램
`,
    opts
  );
}

async function readWord(msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const userConfig = await readConfigFile(userfile);
  const targetUser = userConfig[chatId + ""];

  if (!targetUser) {
    bot.sendMessage(
      chatId,
      "등록된 계정이 없습니다. /start 명령어를 입력하여 주십시오.",
      opts
    );
    return;
  }

  const list = await dbfunc.readItem({ inputPsn: chatId });

  let retStr = "<b><u>단어 조회 결과</u></b>\r\n\r\n";

  list.forEach((i, idx) => {
    retStr += `${idx + 1}. ${i.name}:${i.desc}\r\n`;
  });
  bot.sendMessage(chatId, retStr, opts);
}

const telBot = () => {
  bot.onText(/\/help/, (m) => {
    bot.sendMessage(
      m.chat.id,
      `<b><u>English King Bot을 이용해주셔서 감사합니다.</u></b>
아래와 같은 명령어를 사용하실 수 있습니다.
  
  <b>- 단어(문장) 등록(단어 - 설명)</b>
  <b>- 등록된 문장 검색</b>
  <b>- 등록된 문장 수정/삭제</b>
  <b>- 저장된 단어 랜덤 표시(시험출제용)</b>
  <b>- 저장된 설명 랜덤 표시(시험출제용)</b>
  `,
      { parse_mode: "HTML" }
    );
  });

  // 항상 여기는 같이 타게 되어 있음
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userConfig = await readConfigFile(userfile);
    const targetUser = userConfig[chatId + ""];

    if (!targetUser) return;

    if (targetUser.STATUS === constants.STATUS.INSERT) {
      console.log(`단어등록 상태 msgid:${msg.message_id}, text:${msg.text}`);
      const wordDesc = msg.text.split("-");

      if (wordDesc.length != 2) {
        bot.sendMessage(
          chatId,
          `입력된 형태가 인식되지 않습니다. <b>단어-설명</b> 형태로 입력 되었는지 확인바랍니다.`,
          { parse_mode: "HTML" }
        );
        return;
      } else {
        const item = {
          name: wordDesc[0].trim(),
          desc: wordDesc[1].trim(),
          type: "WORD",
          kind: "WORD",
          inputPsn: chatId + "",
          global: "N",
        };
        await dbfunc.insertItem(item);

        targetUser.STATUS = constants.STATUS.DEFAULT;
        await writeConfigFile(userfile, userConfig);

        bot.sendMessage(chatId, `등록이 완료되었습니다.`);
      }
    } else if (targetUser.STATUS === constants.STATUS.READ) {
      // 일단 있는거 전체다 보여주자.. 자기가 등록한거
      // console.log(`찾을 단어 msgid:${msg.message_id}, text:${msg.text}`);
      // const wordDesc = msg.text.split("-");
      // if (wordDesc.length != 2) {
      //   bot.sendMessage(
      //     chatId,
      //     `입력된 형태가 인식되지 않습니다. <b>단어-설명</b> 형태로 입력 되었는지 확인바랍니다.`,
      //     { parse_mode: "HTML" }
      //   );
      //   return;
      // } else {
      //   const item = {
      //     name: wordDesc[0].trim(),
      //     desc: wordDesc[1].trim(),
      //     type: "WORD",
      //     kind: "WORD",
      //     inputPsn: chatId + "",
      //     global: "N",
      //   };
      //   await dbfunc.insertItem(item);
      //   targetUser.STATUS = constants.STATUS.DEFAULT;
      //   await writeConfigFile(userfile, userConfig);
      //   bot.sendMessage(chatId, `등록이 완료되었습니다.`);
      // }
    } else {
      console.log(
        `아무것도 아닌상태 msgid:${msg.message_id}, text:${msg.text}`
      );
    }
  });

  bot.onText(/\/start/, async (msg, match) => {
    const chatId = msg.chat.id;

    const userConfig = await readConfigFile(userfile);
    const targetUser = userConfig[chatId + ""];

    if (!targetUser) {
      userConfig[chatId + ""] = initUser();
      await writeConfigFile(userfile, userConfig);
    } else if (targetUser.error === "error") {
      bot.sendMessage(
        chatId,
        `Something is wrong. Please contact the developer.`,
        opts
      );
    } else {
      targetUser.STATUS = constants.STATUS.DEFAULT;
      await writeConfigFile(userfile, userConfig);
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
        ],
      },
    };

    bot.sendMessage(
      chatId,
      `<b><u>English King 메신저에 오신것을 환영합니다.</u></b>
자신만의 문장을 등록/수정/삭제/검색이 가능하고, 랜덤출제 기능도 제공하여 암기에 도움이 됩니다.

어떤 기능을 사용해 보시겠습니까?
`,
      opts
    );
  });

  bot.onText(/\/단어등록/, async (msg, match) => {
    registerWord(msg);
  });

  bot.onText(/\/단어조회/, async (msg, match) => {
    readWord(msg);
  });

  // Handle callback queries
  bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const opts = {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: "HTML",
    };
    let text;

    if (action === "registerWord") {
      registerWord(msg);
      //       const userConfig = await readConfigFile(userfile);
      //       const targetUser = userConfig[chatId + ""];

      //       if (!targetUser) {
      //         bot.editMessageText(
      //           "등록된 계정이 없습니다. /start 명령어를 입력하여 주십시오.",
      //           opts
      //         );
      //         return;
      //       }

      //       targetUser.STATUS = "R"; // R:Register
      //       await writeConfigFile(userfile, userConfig);

      //       bot.editMessageText(
      //         `<b><u>단어(문장) 등록 메뉴입니다.</u></b>
      // 입력하시려는 단어와 문장을 아래의 형태로 입력을 해주세요.
      // 단어-문장

      // ex)apple-사과
      //   `,
      //         opts
      //       );
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
};

module.exports = telBot;
