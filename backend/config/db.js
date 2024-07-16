require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('Database Name:', process.env.DB_NAME);
console.log('Database User:', process.env.DB_USER);
console.log('Database Host:', process.env.DB_HOST);

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.log('Error: ' + err));

module.exports = sequelize;
