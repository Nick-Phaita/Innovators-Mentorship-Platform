// models/Thread.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const ConversationWall = require('./ConversationWall');

const Thread = sequelize.define('Thread', {
    thread_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    wall_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ConversationWall',
            key: 'wall_id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false
});

Thread.belongsTo(ConversationWall, { foreignKey: 'wall_id' });

module.exports = Thread;
