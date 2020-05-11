const date = require("date-and-time");
const models = require("../../database/models");
const sequelize = require("sequelize");

const dbfunc = {
  insertItem: async (param) => {
    await models.eng_mst
      .create({
        name: param.name,
        desc: param.desc,
        category: param.category,
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
      return [];
    }
  },
  getCategory: async (id) => {
    try {
      const list = await models.sequelize
        .query(
          `
          SELECT
          DISTINCT category
        FROM
          eng_msts
        WHERE
          inputPsn = ${id};
    `
        )
        .then((r) => {
          return r[0];
        });

      return list;
    } catch (e) {
      return [];
    }
  },
};

module.exports = { dbfunc };
