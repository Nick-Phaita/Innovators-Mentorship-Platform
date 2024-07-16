const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const isAuth = require('../middleware/isAuth');
const multer = require('multer'); // Middleware for handling file uploads
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../frontend/public/img')); // Adjust relative path here
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename based on current timestamp
    }
});

// Multer upload instance
const upload = multer({ storage: storage });

router.get('/create', projectController.getCreateProject); // Render form
router.post('/create', projectController.createProject); // Handle form submission

// In your project controller file (projectController.js)
router.get('/:projectId/mentorship-response/:requestId', projectController.getMentorshipResponse);
router.post('/:projectId/mentorship-response/:requestId', projectController.respondToMentorshipRequest);




router.get('/myprojects', isAuth, projectController.getMyProjects);

// Route to view a specific project
router.get('/:projectId', projectController.getProject);

// Sub-routes for project sections (posts, walls, members)
router.get('/:projectId/posts', projectController.getProjectPosts);
router.get('/:projectId/walls', projectController.getProjectWalls);
router.get('/:projectId/members', projectController.getProjectMembers);


// Route to view threads in a specific wall
//router.get('/:projectId/walls/:wallId/threads', projectController.getThreads);

// Route to get comments for a specific thread
router.get('/:projectId/walls/:wallId/threads/:threadId/comments', projectController.getThreadComments);

// Route to handle form submission for adding a new comment
router.post('/:projectId/walls/:wallId/threads/:threadId/add-comment', isAuth, projectController.addComment);

// Route to get the add-post form
router.get('/:projectId/add-post', projectController.getAddPostForm);

// Route to handle form submission for adding a new post
router.post('/:projectId/add-post', upload.single('image'), projectController.addPost);

router.get('/:projectId/add-member', projectController.renderAddMemberForm);
router.post('/:projectId/add-member', projectController.addMember);

// In your routes file (e.g., projectRoutes.js)
router.get('/:projectId/walls/:wallId/create-thread', projectController.renderCreateThreadForm);
router.post('/:projectId/walls/:wallId/create-thread', projectController.createThread);

router.get('/:projectId/request-mentor', projectController.renderRequestMentorForm);
router.post('/:projectId/request-mentor', projectController.sendMentorRequest);

// routes/projectRoutes.js

router.post('/:projectId/follow', projectController.followProject);
router.post('/:projectId/unfollow', projectController.unfollowProject);



module.exports = router;
