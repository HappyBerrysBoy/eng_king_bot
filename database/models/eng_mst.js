"use strict";
module.exports = (sequelize, DataTypes) => {
  const eng_mst = sequelize.define(
    "eng_mst",
    {
      name: DataTypes.STRING,
      desc: DataTypes.STRING,
      type: DataTypes.STRING,
      kind: DataTypes.STRING,
      inputPsn: DataTypes.STRING,
      global: DataTypes.STRING,
    },
    {}
  );
  eng_mst.associate = function (models) {
    // associations can be defined here
  };
  return eng_mst;
};
