require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const sequelize = require('./config/db');
const User = require('./models/User');
const Profile = require('./models/Profile');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboard');
const projectRoutes = require('./routes/project');
const exploreRoutes = require('./routes/explore');
const notiRoutes = require('./routes/notifications')

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// Define the session store
const sessionStore = new SequelizeStore({
    db: sequelize,
});

// Configure session middleware
app.use(session({
    secret: process.env.SECRET_KEY,  // Use secret from .env file
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    }
}));

sessionStore.sync();

// Middleware to reset session expiration on each request
app.use((req, res, next) => {
    if (req.session) {
        req.session.cookie.expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        req.session.cookie.maxAge = 60 * 60 * 1000; // 1 hour
    }
    next();
});

app.use((req, res, next) => {
    res.locals.isAuth = req.session.user ? true : false;
    next();
});

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

app.get('/',(req,res) => {
    res.render('index');
} );

// Static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/project', projectRoutes);
app.use('/explore', exploreRoutes);
app.use('/notifications', notiRoutes);

// Sync database and start server
sequelize.sync().then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});
