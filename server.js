const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const User = require("./data/User");
const authRouter = require('./routes/auth');
const friendsRouter = require('./routes/friends');
const usersRouter = require('./routes/users');
const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('./config/cloudinaryConfig');
const dbConfig = require('./config/dbConfig');
const { redisConnect, redisClient } = require('./redisConnection');
const { authenticateToken } = require('./middlewares/authenticationMiddleware');
const { globalMiddleware } = require('./middlewares/globalMiddleware');

// Redis initialization
redisConnect();

// MongoDB connection
mongoose.connect(dbConfig.connectionString).catch(error => console.log(error));

const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
});

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

app.use(authenticateToken); 
app.use(globalMiddleware); 

// Routes
app.get('/', (req, res) => {
  res.render('index.ejs', { title: 'Welcome', user: { name: 'Alice' }, items: ['Item 1', 'Item 2'] });
});

app.use('/auth', authRouter);
app.use('/friends', friendsRouter);
app.use('/users', usersRouter);

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

module.exports = { cloudinary };
