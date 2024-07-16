// models/ConversationWall.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Project = require('./Project');

const ConversationWall = sequelize.define('ConversationWall', {
    wall_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Project',
            key: 'project_id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    visibility: {
        type: DataTypes.ENUM('Public', 'Private'),
        defaultValue: 'Public'
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

ConversationWall.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = ConversationWall;
