// models/Comment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Thread = require('./Thread');
const User = require('./User');

const Comment = sequelize.define('Comment', {
    comment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    thread_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Thread',
            key: 'thread_id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User',
            key: 'user_id'
        }
    },
    content: {
        type: DataTypes.TEXT,
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

Comment.belongsTo(Thread, { foreignKey: 'thread_id' });
Comment.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Comment;
