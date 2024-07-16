const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Profile = sequelize.define('Profile', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'User',
            key: 'user_id'
        }
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    occupation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    interests: {
        type: DataTypes.STRING,
        allowNull: true
    },
    skills: {
        type: DataTypes.STRING,
        allowNull: true
    },
    experience: {
        type: DataTypes.STRING,
        allowNull: true
    },
    achievements: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    links: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true, 
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'Profiles'
});

Profile.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Profile, { foreignKey: 'user_id' });

module.exports = Profile;
