const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Cart = require("./Cart");
const Product = require("./Product");

const Cart_Row = sequelize.define("Cart_Row", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

Cart.belongsToMany(Product, { through: Cart_Row });
Product.belongsToMany(Cart, { through: Cart_Row });

module.exports = Cart_Row;
