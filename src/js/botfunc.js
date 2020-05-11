const {
  getUserConfig,
  readConfigFile,
  writeConfigFile,
  initUser,
} = require("./commfunc.js");

// bot 관련 함수들 모음
async function registerWord(bot, userfile, msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const userConfig = await readConfigFile(userfile);
  const targetUser = userConfig[chatId + ""];

  if (!targetUser) {
    bot.sendMessage(chatId, texts.noAccount, opts);
    return;
  }

  targetUser.STATUS = constants.STATUS.INSERT;
  await writeConfigFile(userfile, userConfig);

  bot.sendMessage(chatId, texts.registerWord, opts);
}

async function readWord(bot, userfile, msg) {
  const chatId = msg.chat.id;
  const opts = { parse_mode: "HTML" };

  const userConfig = await readConfigFile(userfile);
  const targetUser = userConfig[chatId + ""];

  if (!targetUser) {
    bot.sendMessage(chatId, texts.noAccount, opts);
    return;
  }

  const list = await dbfunc.readItem({ inputPsn: chatId });

  let retStr = "<b><u>단어 조회 결과</u></b>\r\n\r\n";

  list.forEach((i, idx) => {
    retStr += `${idx + 1}. ${i.name}\r\n`;
    retStr += `- ${i.desc}\r\n`;
  });
  bot.sendMessage(chatId, retStr, opts);
}

module.exports = {
  registerWord,
  readWord,
};
