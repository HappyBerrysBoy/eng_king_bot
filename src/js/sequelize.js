const date = require("date-and-time");
const models = require("../../database/models");

const dbfunc = {
  insertItem: async (param) => {
    await models.eng_mst
      .create({
        name: "TEST",
        desc: "DataTypes.STRING",
        type: "ENG",
        kind: "WORD",
        global: "A",
      })
      .then((result) => {
        console.log(`created scot_sctm_burn_history.then:${result}`);
      });
  },
};
exports.modules = { dbfunc };
