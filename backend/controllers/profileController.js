const Profile = require('../models/Profile');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getCreateProfile = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('profile/createProfile', { message: null });
};

exports.postCreateProfile = async (req, res) => {
    const { firstName, lastName, occupation, interests, skills, experience, achievements, links, bio } = req.body;
    try {
        const profile = await Profile.create({
            user_id: req.session.user.user_id,
            first_name: firstName,
            last_name: lastName,
            occupation,
            interests,
            skills,
            experience,
            achievements,
            links,
            bio,
        });

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).render('profile/createProfile', { message: 'Error occurred during profile creation. Please try again.' });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const profile = await Profile.findOne({ where: { user_id: userId }, include: [{ model: User }] });

        res.render('profile/myprofile', { profile, user: req.session.user , message: null});
    } catch (err) {
        console.error(err);
        res.render('profile/myprofile', { profile: null, user: req.session.user, message: 'Error fetching profile.' });
    }
};

exports.getAuthenticationDetails = (req, res) => {
    res.render('profile/authentication', { user: req.session.user, message: null });
};

exports.updateAuthenticationDetails = async (req, res) => {
    try {
        const { username, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ where: { user_id: req.session.user.user_id } });

        if (user && bcrypt.compareSync(oldPassword, user.password)) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser && existingUser.user_id !== user.user_id) {
                return res.render('profile/authentication', { user: req.session.user, message: 'Username already taken.' });
            }

            user.username = username;
            user.password = bcrypt.hashSync(newPassword, 10);

            await user.save();
            req.session.user = user;
            res.redirect('/profile/myprofile');
        } else {
            res.render('profile/authentication', { user: req.session.user, message: 'Old password is incorrect or user not found.' });
        }
    } catch (err) {
        console.error(err);
        res.render('profile/authentication', { user: req.session.user, message: 'Error updating authentication details.' });
    }
};

exports.getProfileDetails = async (req, res) => {
    const userId = req.params.user_id;

    try {
        const profile = await Profile.findOne({
            where: { user_id: userId },
            include: [{ model: User }]
        });

        if (!profile) {
            return res.render('profile/viewProfile', { profile: null, user: req.session.user, message: 'Profile not found.' });
        }

        res.render('profile/viewProfile', { profile, user: req.session.user, message: null });
    } catch (err) {
        console.error(err);
        res.render('profile/viewProfile', { profile: null, user: req.session.user, message: 'Error fetching profile details.' });
    }
};

exports.getProfileUpdateForm = async (req, res) => {
    try {
        const profile = await Profile.findOne({ where: { user_id: req.session.user.user_id }, include: [{ model: User }] });
        res.render('profile/updateDetails', { profile, user: req.session.user, message: null });
    } catch (err) {
        console.error(err);
        res.render('profile/updateDetails', { profile: null, user: req.session.user, message: 'Error fetching profile details.' });
    }
};

exports.updateProfileDetails = async (req, res) => {
    try {
        const { firstName, lastName, occupation, interests, skills, experience, achievements, links, bio } = req.body;
        const profile = await Profile.findOne({ where: { user_id: req.session.user.user_id } });

        if (profile) {
            profile.first_name = firstName;
            profile.last_name = lastName;
            profile.occupation = occupation;
            profile.interests = interests;
            profile.skills = skills;
            profile.experience = experience;
            profile.achievements = achievements;
            profile.links = links;
            profile.bio = bio;

            await profile.save();
            res.redirect('/profile/myprofile');
        } else {
            res.render('profile/updateDetails', { profile: null, user: req.session.user, message: 'Profile not found.' });
        }
    } catch (err) {
        console.error(err);
        res.render('profile/updateDetails', { profile: null, user: req.session.user, message: 'Error updating profile details.' });
    }
};
