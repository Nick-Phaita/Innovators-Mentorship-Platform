const Follow = require('../models/Follow');
const Project = require('../models/Project');
const { Sequelize } = require('sequelize');

exports.getDashboard = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user.user_id;

        // Fetch projects followed by the user with their associated follows
        const followedProjects = await Follow.findAll({
            where: { follower_id: userId },
            include: [{ model: Project }]
        });

        // Fetch the count of follows for each project
        const projectsWithFollowCount = await Promise.all(
            followedProjects.map(async (follow) => {
                const project = follow.Project;
                const followersCount = await Follow.count({
                    where: { project_id: project.project_id }
                });
                return {
                    ...project.dataValues,
                    followersCount
                };
            })
        );

        res.render('dashboard', { user, followedProjects: projectsWithFollowCount });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching followed projects.');
    }
};

