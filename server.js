const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const User = require("./data/User");
const GameSession = require("./data/GameSession");
const authRouter = require('./routes/auth');
const friendsRouter = require('./routes/friends');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const gamesRouter = require('./routes/games');
const tictactoe = require('./routes/tictactoe');
const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('./config/cloudinaryConfig');
const dbConfig = require('./config/dbConfig');
const { redisConnect, redisClient } = require('./redisConnection');
const { authenticateToken } = require('./middlewares/authenticationMiddleware');
const { livesSetter } = require('./middlewares/livesMiddleware');
const { globalMiddleware } = require('./middlewares/globalMiddleware');
const { assignNotifications } = require('./middlewares/notificationMiddleware');
const { initializeSocket } = require('./socketManager');
const { instrument } = require('@socket.io/admin-ui')

const app = express();

// socket configuration
const io = require('socket.io')(8080, {
  cors: {
    origin: ['http://localhost:3000', 'https://admin.socket.io'],
    credentials: true, 
  },
  pingInterval: 30000, // Ping every 30 seconds
  pingTimeout: 120000, // Wait 120 seconds for pong
})

app.set('io', io);
initializeSocket(io);
instrument(io, {auth: false})

// Redis initialization
redisConnect();

// MongoDB connection
mongoose.connect(dbConfig.connectionString).catch(error => console.log(error));

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
app.use(assignNotifications);
app.use(livesSetter);

// Routes
app.get('/', (req, res) => {
  res.render('index.ejs', { title: 'Welcome', user: { name: 'Alice' }, items: ['Item 1', 'Item 2'] });
});

app.use('/auth', authRouter);
app.use('/friends', friendsRouter);
app.use('/users', usersRouter);
app.use('/notifications', notificationsRouter);
app.use('/games', gamesRouter);
app.use('/TicTacToe', tictactoe)

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

module.exports = { cloudinary };
