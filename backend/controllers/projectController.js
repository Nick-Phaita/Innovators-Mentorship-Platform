// Assuming you have the necessary imports and setup
const Post = require('../models/Post');
const User = require('../models/User'); // Assuming you have a User model
const Project = require('../models/Project');
const Follow = require('../models/Follow');
const ProjectMember = require('../models/ProjectMember');
const ConversationWall = require('../models/ConversationWall');
const Thread = require('../models/Thread');
const Comment = require('../models/Comment');
//const sequelize = require('../config/db');
const { Op } = require('sequelize');
const path = require('path');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');

exports.getCreateProject = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/auth'); // Redirect to login if not authenticated
    }
    
    res.render('project/createProject', { user: req.session.user, message: null });
};

exports.createProject = async (req, res) => {
    try {
        const { title, description, publicWallName, privateWallName } = req.body;
        const userId = req.session.user.user_id;

        // Create the project
        const project = await Project.create({ title, description, owner_id: userId });

        // Create public and private walls
        const publicWall = await ConversationWall.create({
            title: publicWallName,
            visibility: 'Public',
            project_id: project.project_id
        });

        const privateWall = await ConversationWall.create({
            title: privateWallName,
            visibility: 'Private',
            project_id: project.project_id
        });

        // Add the owner to project members
        await ProjectMember.create({
            project_id: project.project_id,
            user_id: userId,
            role: 'Owner'
        });

        res.redirect('/project/myprojects'); // Redirect to my projects page
    } catch (err) {
        console.error(err);
        res.render('project/createProject', { user: req.session.user, message: 'Error creating project.' });
    }
};

exports.getMyProjects = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user.user_id;
        const isInnovator = user.role === 'innovator';

        // Fetch projects where the user is a member
        const memberProjects = await ProjectMember.findAll({
            where: { user_id: userId },
            include: [{ model: Project }]
        });

        // Fetch the count of follows for each project
        const projectsWithFollowCount = await Promise.all(
            memberProjects.map(async (member) => {
                const project = member.Project;
                const followersCount = await Follow.count({
                    where: { project_id: project.project_id }
                });
                return {
                    ...project.dataValues,
                    followersCount,
                    role: member.role
                };
            })
        );

        res.render('project/myprojects', { user, projects: projectsWithFollowCount, isInnovator, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/myprojects', { user: req.session.user, projects: [], isInnovator: false, message: 'Error fetching projects.' });
    }
};

exports.getProject = async (req, res) => {
    const projectId = req.params.projectId;
    console.log(projectId);
    
    try {
        // Fetch project details
        const project = await Project.findByPk(projectId);
        const user = req.session.user;

        if (!project) {
            return res.render('project/view', { project: null, message: 'Project not found', user, followersCount: 0, isFollowed: false, isOwner: false, showRequestMentor: false });
        }

        const isOwner = req.session.user.user_id === project.owner_id;

        // Count the number of followers for the project
        const followersCount = await Follow.count({
            where: { project_id: projectId }
        });

        // Determine if the current user follows this project
        const isFollowed = await Follow.findOne({
            where: { follower_id: user.user_id, project_id: projectId }
        });

        // Fetch project members to determine user's role
        const userId = req.session.user.user_id; // Assuming user is logged in
        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: userId
            }
        });

        const isOwnerOrMember = projectMember && (projectMember.role === 'Owner' || projectMember.role === 'Member');
        const showRequestMentor = isOwnerOrMember;

        console.log(projectMember);

        res.render('project/view', {
            project,
            showRequestMentor,
            user: req.session.user,
            followersCount,
            isFollowed,
            isOwner,
            message: null
        });
    } catch (err) {
        console.error(err);
        res.render('project/view', { project: null, message: 'Error fetching project details', user: req.session.user, followersCount: 0, isFollowed: false, isOwner: false, showRequestMentor: false });
    }
};

exports.getProjectPosts = async (req, res) => {
    const projectId = req.params.projectId; // Assuming project ID is passed in the URL
    const userId = req.session.user.user_id;
    const project = await Project.findByPk(projectId);

    try {
        // Check if the user is a member of the project
        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: userId
            }
        });

        const isMember = projectMember;
        const isOwner = req.session.user.user_id === project.owner_id;
        const isOwnerOrMember = projectMember && (projectMember.role === 'Owner' || projectMember.role === 'Member');
        const showRequestMentor = isOwnerOrMember;

        // Fetch posts with visibility consideration
        const posts = await Post.findAll({
            where: {
                project_id: projectId,
                [Op.or]: [
                    { visibility: 'Public' },
                    {
                        visibility: 'Private',
                        [Op.and]: [
                            { user_id: isMember ? { [Op.ne]: null } : userId }, // If isMember, any user_id; otherwise, user_id must be userId
                        ]
                    }
                ]
            },
            include: [{ model: User, attributes: ['username'] }],
            order: [['created_at', 'DESC']]
        });

        res.render('project/posts', { project, posts, user: req.session.user, showRequestMentor, isOwner, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/posts', { project: null, posts: [], user: req.session.user, showRequestMentor: false, isOwner: false, message: 'Error fetching project posts.' });
    }
};

exports.getAddPostForm = async (req, res) => {
    const projectId = req.params.projectId; // Assuming project ID is passed in the URL

    try {
        // Fetch project details if needed
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.render('project/addPost', { project: null, message: 'Project not found', user: req.session.user });
        }

        // Check if the user is a member of the project
        const userId = req.session.user.user_id; // Assuming user is logged in
        const isMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: userId
            }
        });

        // Render the add-post form view
        res.render('project/addPost', { project, user: req.session.user, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/addPost', { project: null, message: 'Error fetching project details', user: req.session.user });
    }
};

// Route handler to handle the form submission for adding a new post
exports.addPost = async (req, res) => {
    const projectId = req.params.projectId; // Assuming project ID is passed in the URL
    const userId = req.session.user.user_id; // Assuming user is logged in

    try {
        // Check if the user is a member of the project
        const isMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: userId
            }
        });

        if (!isMember) {
            return res.render('project/addPost', { project: null, message: 'You are not authorized to add posts to this project.', user: req.session.user });
        }

        // Process form data
        const { content, visibility } = req.body;
        let imageUrl = req.file ? path.join('/img', req.file.filename) : null; // Construct imageUrl

        // Handle image upload if provided
        if (req.file) {
            imageUrl = `/img/${req.file.filename}`; // Assuming files are stored in public/img directory
        }

        // Create new post in the database
        const newPost = await Post.create({
            project_id: projectId,
            user_id: userId,
            content: content,
            visibility: visibility,
            imageUrl: imageUrl // Save imageUrl if an image was uploaded
        });

        res.redirect(`/project/${projectId}/posts`);
    } catch (err) {
        console.error(err);
        res.render('project/addPost', { project: null, message: 'Error adding new post.', user: req.session.user });
    }
};

exports.getProjectWalls = async (req, res) => {
    const projectId = req.params.projectId;
    const wallId = req.params.wallId;
    const threadId = req.params.threadId;

    if (!req.session.user) {
        return res.redirect('/auth/auth'); // Redirect to login if user is not authenticated
    }

    try {
        const project = await Project.findByPk(projectId);
        let walls = await ConversationWall.findAll({ where: { project_id: projectId } });

        if (!project) {
            return res.render('project/walls', { message: 'Project not found', user: req.session.user });
        }

        const userId = req.session.user.user_id;
        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: userId
            }
        });

        const isMember = projectMember;
        const isOwner = req.session.user.user_id === project.owner_id;
        const isOwnerOrMember = projectMember && (projectMember.role === 'Owner' || projectMember.role === 'Member');
        const showRequestMentor = isOwnerOrMember;
        const showPrivateWall = isMember;

        // Fetch threads for each wall
        for (let wall of walls) {
            wall.threads = await Thread.findAll({ where: { wall_id: wall.wall_id } });
        }

        res.render('project/walls', {
            project,
            walls,
            user: req.session.user,
            currentWallId: wallId,
            currentThreadId: threadId,
            showPrivateWall,
            showRequestMentor,
            isMember,
            isOwner,
            message: null // No error message
        });
    } catch (err) {
        console.error(err);
        res.render('project/walls', { message: 'Error fetching project walls.', user: req.session.user });
    }
};

// Fetches all threads within a specific wall
exports.getThreads = async (req, res) => {
    const projectId = req.params.projectId;
    const wallId = req.params.wallId;

    try {
        const project = await Project.findByPk(projectId);
        const wall = await ConversationWall.findByPk(wallId);
        const threads = await Thread.findAll({
            where: { wall_id: wallId },
            include: [{ model: ConversationWall, where: { project_id: projectId } }]
        });

        res.render('project/threads', { threads, wallId, wall, projectId, project, user: req.session.user, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/threads', { threads: [], wallId, wall: null, projectId, project: null, user: req.session.user, message: 'Error fetching threads.' });
    }
};

// Fetches all comments within a specific thread
exports.getThreadComments = async (req, res) => {
    const { projectId, wallId, threadId } = req.params;

    try {
        const thread = await Thread.findByPk(threadId);
        if (!thread) {
            return res.render('project/thread-comments', { comments: [], projectId, wallId, threadId, user: req.session.user, thread: null, message: 'Thread not found' });
        }

        const comments = await Comment.findAll({
            where: { thread_id: threadId },
            include: [{ model: User, attributes: ['username'] }],
            order: [['created_at', 'ASC']]
        });

        res.render('project/thread-comments', { comments, projectId, wallId, threadId, user: req.session.user, thread, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/thread-comments', { comments: [], projectId, wallId, threadId, user: req.session.user, thread: null, message: 'Error fetching thread comments.' });
    }
};

exports.addComment = async (req, res) => {
    const { projectId, wallId, threadId } = req.params;
    const userId = req.session.user.user_id; // Assuming user is logged in

    try {
        // Check if the thread exists
        const thread = await Thread.findByPk(threadId);
        if (!thread) {
            return res.render('project/thread-comments', { comments: [], projectId, wallId, threadId, user: req.session.user, thread: null, message: 'Thread not found' });
        }

        const { content } = req.body;

        if (!content) {
            console.log('Comment content is empty or undefined');
            return res.render('project/thread-comments', { comments: [], projectId, wallId, threadId, user: req.session.user, thread, message: 'Comment content cannot be empty' });
        }

        const newComment = await Comment.create({
            thread_id: threadId,
            user_id: userId,
            content: content
        });

        // Fetch all comments for the thread after adding the new comment
        const comments = await Comment.findAll({
            where: { thread_id: threadId },
            include: [{ model: User, attributes: ['username'] }],
            order: [['created_at', 'ASC']]
        });

        // Send the updated comments HTML back as a response
        res.render('project/thread-comments', { comments, projectId, wallId, threadId, user: req.session.user, thread, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/thread-comments', { comments: [], projectId, wallId, threadId, user: req.session.user, thread: null, message: 'Error adding new comment.' });
    }
};

exports.getProjectMembers = async (req, res) => {
    const projectId = req.params.projectId;

    if (!req.session.user) {
        return res.redirect('/auth/login'); // Redirect to login if user is not authenticated
    }

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.render('project/members', { project: null, projectMembers: [], user: req.session.user, showRequestMentor: false, isOwner: false, message: 'Project not found' });
        }

        const projectMembers = await ProjectMember.findAll({
            where: { project_id: projectId },
            include: [{ model: User, attributes: ['username'] }]
        });

        const userId = req.session.user.user_id;
        const isOwner = userId === project.owner_id;
        
        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: userId
            }
        });

        const isOwnerOrMember = projectMember && (projectMember.role === 'Owner' || projectMember.role === 'Member');
        const showRequestMentor = isOwnerOrMember;

        res.render('project/members', { project, projectMembers, user: req.session.user, showRequestMentor, isOwner, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/members', { project: null, projectMembers: [], user: req.session.user, showRequestMentor: false, isOwner: false, message: 'Error fetching project members.' });
    }
};

exports.renderAddMemberForm = async (req, res) => {
    const projectId = req.params.projectId;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.render('project/add-member', { project: null, message: 'Project not found' });
        }

        if (project.owner_id !== req.session.user.user_id) {
            return res.render('project/add-member', { project: null, message: 'Unauthorized' });
        }

        res.render('project/add-member', { project, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/add-member', { project: null, message: 'Error rendering add member form.' });
    }
};

exports.addMember = async (req, res) => {
    const projectId = req.params.projectId;
    const { username } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.render('project/members', { projectId, message: 'User not found.' });
        }

        // Ensure the logged-in user is the project owner
        const project = await Project.findByPk(projectId);
        if (!project || project.owner_id !== req.session.user.user_id) {
            return res.render('project/members', { projectId, message: 'Unauthorized to add members.' });
        }

        // Add the user as a member
        await ProjectMember.create({
            project_id: projectId,
            user_id: user.user_id,
            role: 'Member'
        });

        // Fetch all project members
        const members = await ProjectMember.findAll({
            where: { project_id: projectId },
            attributes: ['user_id']
        });

        // Create notifications for each project member
        for (const member of members) {
            await Notification.create({
                user_id: member.user_id,
                content: `${username} has been added to "${project.title}".`,
                is_read: false
            });
        }

        res.redirect(`/project/${projectId}/members`);
    } catch (err) {
        console.error(err);
        res.render('project/members', { projectId, message: 'Error adding project member.' });
    }
};

exports.renderCreateThreadForm = async (req, res) => {
    const projectId = req.params.projectId;
    const wallId = req.params.wallId;

    try {
        const project = await Project.findByPk(projectId);
        const wall = await ConversationWall.findByPk(wallId);

        if (!project || !wall) {
            return res.render('project/create-thread', { project: null, wall: null, message: 'Project or Wall not found.' });
        }

        // Ensure only project members can access this page
        const isMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: req.session.user.user_id
            }
        });

        if (!isMember) {
            return res.render('project/create-thread', { project, wall, message: 'Unauthorized.' });
        }

        res.render('project/create-thread', { project, wall, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/create-thread', { project: null, wall: null, message: 'Error rendering create thread form.' });
    }
};

exports.createThread = async (req, res) => {
    const projectId = req.params.projectId;
    const wallId = req.params.wallId;
    const { title } = req.body;

    try {
        // Ensure the wall exists
        const wall = await ConversationWall.findByPk(wallId);
        if (!wall) {
            return res.render('project/walls', { projectId, message: 'Wall not found.' });
        }

        // Ensure only project members can create threads
        const isMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: req.session.user.user_id
            }
        });

        if (!isMember) {
            return res.render('project/walls', { projectId, message: 'Unauthorized.' });
        }

        // Create the new thread
        await Thread.create({
            title,
            wall_id: wallId,
            created_by: req.session.user.user_id
        });

        res.redirect(`/project/${projectId}/walls`);
    } catch (err) {
        console.error(err);
        res.render('project/walls', { projectId, message: 'Error creating thread.' });
    }
};

exports.renderRequestMentorForm = async (req, res) => {
    const projectId = req.params.projectId;

    try {
        const project = await Project.findByPk(projectId);
        const isOwner = req.session.user.user_id === project.owner_id;
        const mentorshipRequests = await MentorshipRequest.findAll({
            where: { project_id: projectId },
            include: [{ model: User, attributes: ['username'] }]
        });

        res.render('project/request-mentor', { project, mentorshipRequests, user: req.session.user, isOwner, showRequestMentor: true, message: null });
    } catch (err) {
        console.error(err);
        res.render('project/request-mentor', { project: null, mentorshipRequests: [], user: req.session.user, isOwner: false, showRequestMentor: true, message: 'Error displaying mentorship requests.' });
    }
};

exports.sendMentorRequest = async (req, res) => {
    const projectId = req.params.projectId;
    const { mentorUsername } = req.body;

    try {
        const mentor = await User.findOne({ where: { username: mentorUsername } });

        if (!mentor) {
            return res.render('project/request-mentor', { projectId, message: 'Mentor not found.' });
        }

        if (mentor.role !== 'mentor') {
            return res.render('project/request-mentor', { projectId, message: 'User is not a mentor.' });
        }

        const mentorshipRequest = await MentorshipRequest.create({
            project_id: projectId,
            mentor_id: mentor.user_id,
            status: 'Pending'
        });

        const project = await Project.findByPk(projectId);

        if (project) {
            await Notification.create({
                user_id: mentor.user_id,
                content: `You have a new mentorship request for ${project.title}. Click <a href="/project/${projectId}/mentorship-response/${mentorshipRequest.request_id}">here</a> to respond.`,
                is_read: false
            });
        } else {
            console.error('Project not found');
        }

        res.redirect(`/project/${projectId}/request-mentor`);
    } catch (err) {
        console.error(err);
        res.render('project/request-mentor', { projectId, message: 'Error sending mentorship request.' });
    }
};

exports.getMentorshipResponse = async (req, res) => {
    const { projectId, requestId } = req.params;

    try {
        const request = await MentorshipRequest.findByPk(requestId);
        
        if (!request) {
            return res.render('mentorshipResponse', { projectId, requestId, request: null, message: 'Mentorship request not found.' });
        }

        const project = await Project.findByPk(projectId);
        res.render('mentorshipResponse', { project, projectId, requestId, request, message: null });
    } catch (err) {
        console.error(err);
        res.render('mentorshipResponse', { projectId, requestId, request: null, message: 'Error fetching mentorship request.' });
    }
};

exports.respondToMentorshipRequest = async (req, res) => {
    const { response } = req.body; // 'response' can be 'accept' or 'reject'
    const projectId = req.params.projectId;
    const requestId = req.params.requestId;

    try {
        const request = await MentorshipRequest.findOne({ where: { request_id: requestId } });

        if (!request) {
            return res.render('mentorshipResponse', { projectId, requestId, request: null, message: 'Mentorship request not found.' });
        }

        if (response === 'accept') {
            request.status = 'Accepted';
            await ProjectMember.create({
                project_id: projectId,
                user_id: request.mentor_id,
                role: 'Mentor'
            });
        } else if (response === 'reject') {
            request.status = 'Rejected';
        } else {
            return res.render('mentorshipResponse', { projectId, requestId, request, message: 'Invalid response.' });
        }

        await request.save();

        const project = await Project.findByPk(projectId);
        const projectMembers = await ProjectMember.findAll({ where: { project_id: projectId } });
        for (const member of projectMembers) {
            await Notification.create({
                user_id: member.user_id,
                content: `The mentorship request for ${project.title} has been ${request.status}.`,
                is_read: false
            });
        }

        res.redirect(`/project/${projectId}`); // Redirect to the project page after responding
    } catch (err) {
        console.error(err);
        res.render('mentorshipResponse', { projectId, requestId, request: null, message: 'Error responding to mentorship request.' });
    }
};

exports.followProject = async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const projectId = req.params.projectId;

        // Check if the user is already following the project
        const existingFollow = await Follow.findOne({
            where: { follower_id: userId, project_id: projectId }
        });

        if (existingFollow) {
            return res.status(400).json({ success: false, message: 'You are already following this project.' });
        }

        // Create the follow entry
        await Follow.create({ follower_id: userId, project_id: projectId });

        // Fetch the username of the user who is following the project
        const user = await User.findByPk(userId, {
            attributes: ['username']
        });
        const username = user.username;

        // Fetch the project details to get the project title
        const project = await Project.findByPk(projectId, {
            attributes: ['title']
        });
        const projectTitle = project.title;

        // Fetch all project members
        const members = await ProjectMember.findAll({
            where: { project_id: projectId },
            attributes: ['user_id']  // Assuming user_id corresponds to the User model
        });

        // Create notifications for each project member
        for (const member of members) {
            await Notification.create({
                user_id: member.user_id,
                content: `${username} has followed "${projectTitle}".`,
                is_read: false
            });
        }

        res.json({ success: true, message: 'You are now following the project.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'An error occurred while following the project.' });
    }
};

exports.unfollowProject = async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const projectId = req.params.projectId;

        await Follow.destroy({ where: { follower_id: userId, project_id: projectId } });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};