const { Sequelize } = require("sequelize");

module.exports = new Sequelize("pi", "pi", "@WSX2wsx", {
  host: "localhost",
  port: "5432",
  dialect: "postgres",
});
