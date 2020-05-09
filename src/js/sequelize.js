const date = require("date-and-time");
const models = require("../../database/models");

const dbfunc = {
  insertItem: async (param) => {
    await models.eng_mst
      .create({
        name: param.name,
        desc: param.desc,
        type: param.type,
        kind: param.kind,
        inputPsn: param.inputPsn,
        global: param.global,
      })
      .then((result) => {
        console.log(`created scot_sctm_burn_history.then:${result}`);
      });
  },
  readItem: async (param) => {
    try {
      const list = await models.eng_mst
        .findAll({
          where: { inputPsn: param.inputPsn },
        })
        .then((result) => {
          return result;
        });

      return list;
    } catch (e) {
      res.json({ error: e.message });
    }
  },
};

module.exports = { dbfunc };
