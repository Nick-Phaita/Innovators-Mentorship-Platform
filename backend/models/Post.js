// models/Post.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');

const Post = sequelize.define('Post', {
    post_id: {
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
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.TEXT, // or VARCHAR
        allowNull: true // Depending on whether posts are required to have images
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

Post.belongsTo(User, { foreignKey: 'user_id' });
Post.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = Post;
