require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');

exports.getAuth = (req, res) => {
    res.render('auth/auth', { message: null });
};


exports.postSignup = async (req, res) => {
    const { email, username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            email,
            username,
            password: hashedPassword,
            role,
            verification_token: verificationToken,
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email',
            text: `Please verify your email using this code: ${verificationToken}`,
        };

        await transporter.sendMail(mailOptions);

        res.render('auth/verify', { email, message: 'Verification email sent. Please check your inbox.' });
    } catch (err) {
        console.error(err);
        res.status(500).render('auth/auth', { message: 'Error occurred during signup. Please try again.' });
    }
};

exports.getVerify = (req, res) => {
    res.render('auth/verify', { email: null, message: null });
};

exports.postVerify = async (req, res) => {
    const { email, verificationToken } = req.body;
    try {
        const user = await User.findOne({ where: { email, verification_token: verificationToken } });
        if (!user) {
            return res.status(400).render('auth/verify', { email, message: 'Invalid verification token.' });
        }

        user.verified = true;
        user.verification_token = null;
        await user.save();

        res.render('auth/auth', { message: 'Email verified successfully. Please log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).render('auth/verify', { email, message: 'Error occurred during verification. Please try again.' });
    }
};


exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user || !user.verified) {
            return res.status(400).render('auth/auth', { message: 'Invalid email or email not verified.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('auth/auth', { message: 'Invalid password.' });
        }

        // Set user session
        req.session.user = user;

        // Check if user has created a profile
        const profile = await Profile.findOne({ where: { user_id: user.user_id } });
        if (profile) {
            // User has already created a profile, redirect to dashboard
            return res.redirect('/dashboard');
        } else {
            // First time login, redirect to create profile
            return res.redirect('/profile/create');
        }
    } catch (err) {
        console.error(err);
        res.status(500).render('auth/auth', { message: 'Error occurred during login. Please try again.' });
    }
};

// controllers/authController.js

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/auth'); // Redirect to login or home page
    });
};
