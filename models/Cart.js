const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const User = require("./User");


const Cart = sequelize.define("Cart", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }
});

User.hasMany(Cart);
Cart.belongsTo(User);

module.exports = Cart;