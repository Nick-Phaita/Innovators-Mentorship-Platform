// controllers/exploreController.js

const Project = require('../models/Project');
const Profile = require('../models/Profile');
const Follow = require('../models/Follow');
const User = require('../models/User');
const ProjectMember = require('../models/ProjectMember'); // Assuming this is the model for project members
const { Op } = require('sequelize');

exports.getExplore = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user.user_id;

        // Fetch the user's profile
        const userProfile = await Profile.findOne({ where: { user_id: userId } });

        if (!userProfile) {
            return res.render('explore', { user, projects: [], mentors: [], isInnovator: false, message: 'Profile not found.' });
        }

        const isInnovator = user.role === 'innovator';

        const followedProjects = await Follow.findAll({
            where: { follower_id: userId },
            attributes: ['project_id']
        });

        const projectMemberships = await ProjectMember.findAll({
            where: { user_id: userId },
            attributes: ['project_id']
        });

        const followedProjectIds = followedProjects.map(follow => follow.project_id);
        const memberProjectIds = projectMemberships.map(membership => membership.project_id);

        const excludedProjectIds = [...new Set([...followedProjectIds, ...memberProjectIds])];

        const profileAttributes = ['interests', 'skills', 'experience', 'occupation', 'achievements'];
        const profileValues = profileAttributes.map(attr => userProfile[attr]).filter(Boolean).join(' ');

        // Fetch suggested projects
        const suggestedProjects = await Project.findAll({
            where: {
                project_id: { [Op.notIn]: excludedProjectIds },
                [Op.or]: profileValues.split(' ').map(value => ({
                    [Op.or]: [
                        { title: { [Op.like]: `%${value}%` } },
                        { description: { [Op.like]: `%${value}%` } }
                    ]
                }))
            },
            limit: 10
        });

        // Randomly select 3 projects
        const selectedProjects = suggestedProjects.sort(() => 0.5 - Math.random()).slice(0, 3);

        // Fetch suggested mentors
        const suggestedMentors = await Profile.findAll({
            where: {
                user_id: { [Op.not]: userId },
                [Op.or]: profileAttributes.map(attr => ({
                    [Op.or]: profileValues.split(' ').map(value => ({
                        [attr]: { [Op.like]: `%${value}%` }
                    }))
                }))
            },
            include: [{ model: User, where: { role: 'Mentor' } }],
            limit: 10
        });

        // Randomly select 3 mentors
        const selectedMentors = suggestedMentors.sort(() => 0.5 - Math.random()).slice(0, 3);

        res.render('explore', {
            user,
            projects: selectedProjects,
            mentors: selectedMentors,
            isInnovator,
            message:null
        });
    } catch (err) {
        console.error(err);
        res.render('explore', { user: req.session.user, projects: [], mentors: [], isInnovator: false, message: 'Error fetching explore data.' });
    }
};


exports.search = async (req, res) => {
    try {
        const query = req.query.query;
        const user = req.session.user;
        const userId = user.user_id;

        if (!query) {
            return res.redirect('/explore');
        }

        // Log the query
        console.log('Search query:', query);

        // Search for user profiles by profile attributes
        const profileAttributesResults = await Profile.findAll({
            where: {
                [Op.or]: [
                    { first_name: { [Op.like]: `%${query}%` } },
                    { last_name: { [Op.like]: `%${query}%` } },
                    { occupation: { [Op.like]: `%${query}%` } },
                    { interests: { [Op.like]: `%${query}%` } },
                    { skills: { [Op.like]: `%${query}%` } },
                    { experience: { [Op.like]: `%${query}%` } },
                    { achievements: { [Op.like]: `%${query}%` } },
                    { bio: { [Op.like]: `%${query}%` } }
                ]
            },
            include: [User]
        });

        // Log profiles found by profile attributes
        console.log('Profiles found by attributes:', profileAttributesResults);

        // Search for user profiles by username
        const usernameResults = await Profile.findAll({
            include: [{
                model: User,
                where: { username: { [Op.like]: `%${query}%` } }
            }]
        });

        // Log profiles found by username
        console.log('Profiles found by username:', usernameResults);

        // Merge results
        const profiles = [...profileAttributesResults, ...usernameResults];

        // Remove duplicates by user ID
        const uniqueProfiles = profiles.filter((profile, index, self) =>
            index === self.findIndex((p) => (
                p.user_id === profile.user_id
            ))
        );

        // Log unique profiles
        console.log('Unique profiles:', uniqueProfiles);

        // Search for projects
        const projects = await Project.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${query}%` } },
                    { description: { [Op.like]: `%${query}%` } }
                ]
            }
        });

        // Log projects found
        console.log('Projects found:', projects);

        res.render('searchResults', {
            user,
            query,
            profiles: uniqueProfiles,
            projects,
            message: null
        });
    } catch (err) {
        console.error(err);
        res.render('searchResults', { user: req.session.user, query: req.query.query, profiles: [], projects: [], message: 'Error performing search.' });
    }
};

