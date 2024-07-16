// models/ProjectMember.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');

const ProjectMember = sequelize.define('ProjectMember', {
    project_member_id: {
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
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User',
            key: 'user_id'
        }
    },
    role: {
        type: DataTypes.ENUM('Owner', 'Member', 'Mentor'),
        defaultValue: 'Member'
    },
    joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false
});

ProjectMember.belongsTo(User, { foreignKey: 'user_id' });
ProjectMember.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = ProjectMember;
