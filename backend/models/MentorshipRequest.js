// models/MentorshipRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Project = require('./Project');
const User = require('./User');

const MentorshipRequest = sequelize.define('MentorshipRequest', {
    request_id: {
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
    mentor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User',
            key: 'user_id'
        }
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected'),
        defaultValue: 'Pending'
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

MentorshipRequest.belongsTo(Project, { foreignKey: 'project_id' });
MentorshipRequest.belongsTo(User, { foreignKey: 'mentor_id' });

module.exports = MentorshipRequest;
