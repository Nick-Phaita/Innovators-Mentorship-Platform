const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path is correct
const User = require('./User'); // Adjust path if necessary
const Follow = require('./Follow'); // Adjust path if necessary

const Project = sequelize.define('Project', {
    project_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User', // Adjust to your actual User model name
            key: 'user_id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'Projects' // Ensure this matches your actual table name
});

Project.belongsTo(User, { foreignKey: 'owner_id' });


module.exports = Project;
