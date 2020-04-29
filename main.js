const TelegramBot = require("node-telegram-bot-api");
const config = require("./config.json");
const constants = require("./constants.json");

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// 항상 여기는 같이 타게 되어 있음
bot.on("message", (msg) => {
  const id = msg.chat.id;

  console.log("this msgid:" + msg.message_id);

  // bot.sendMessage(id, `메아리 : ${msg.text}`);
});

bot.onText(/\/start/, (msg, match) => {
  const chatId = msg.chat.id;

  // bot.sendMessage(chatId, "사번을 입력하세요");

  const opts = {
    reply_markup: {
      text: "출근처리",
      callback_data: "gotowork",
    },
  };

  bot.sendMessage(chatId, "사번을 입력하세요", opts);
});

bot.onText(/\/t/, (msg, match) => {
  const chatId = msg.chat.id;

  const opts = {
    reply_markup: {
      input_message_content: [
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
      ],
    },
  };

  bot.sendMessage(chatId, "test1", opts);
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

// Handle callback queries
bot.on("callback_query", function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };
  let text;

  if (action === "gotowork") {
    text = "오늘도 즐거운 하루!";
  } else if (action === "outWork") {
    text = "고생하세요!!";
  } else if (action === "businessTrip") {
    text = "차조심!!";
  } else if (action === "workInHouse") {
    text = "밥잘챙겨드세요!!";
  } else if (action === "off") {
    text = "즐거운시간 보내세요!!";
  } else if (action === "study") {
    text = "열공하세요!!";
  }

  bot.editMessageText(text, opts);
});

bot.onText(/\/btn/, function onLoveText(msg) {
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      resize_keyboard: true,
      one_time_keyboard: true,
      keyboard: [["yes"], ["no"]],
    },
  };
  bot.sendMessage(msg.chat.id, "Click Button", opts);
});

// Matches /audio
bot.onText(/\/audio/, function onAudioText(msg) {
  // From HTTP request
  const url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg";
  const audio = request(url);
  bot.sendAudio(msg.chat.id, audio);
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = "꺄악: " + match[1];
  // 식별된 "msg"는 보내온 채팅방('chatId')에게 앵무새처럼 재전송한다 ("꺄악: 'msg'")
  bot.sendMessage(chatId, resp);
});
