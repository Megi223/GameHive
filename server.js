const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const User = require("./data/User");
const authRouter = require('./routes/auth');
const friendsRouter = require('./routes/friends');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const gamesRouter = require('./routes/games');
const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('./config/cloudinaryConfig');
const dbConfig = require('./config/dbConfig');
const { redisConnect, redisClient } = require('./redisConnection');
const { authenticateToken } = require('./middlewares/authenticationMiddleware');
const { globalMiddleware } = require('./middlewares/globalMiddleware');
const { assignNotifications } = require('./middlewares/notificationMiddleware');

const io = require('socket.io')(8080, {
  cors: {
    origin: ['http://localhost:3000', 'https://admin.socket.io'],
    credentials: true, 
  },
  pingInterval: 30000, // Ping every 30 seconds
  pingTimeout: 120000, // Wait 120 seconds for pong
})
const { instrument } = require('@socket.io/admin-ui')

// Redis initialization
redisConnect();

// MongoDB connection
mongoose.connect(dbConfig.connectionString).catch(error => console.log(error));

const app = express();

app.set('io', io);

// Configure sockets
io.on('connection', async (socket) => {
  console.log("request for connection retrieved")
  const id = socket.handshake.auth.userID;
  if(id){
    console.log(socket.handshake.auth)
    console.log("Server.js " + socket.id)
    await redisClient.set(`socketID:${id}`, socket.id, { EX: 24 * 60 * 60 });
  }
  
  socket.on('disconnect', async (reason) => {
    await redisClient.del(`socketID:${id}`);
    console.log('Disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('live-restored', async (data) => {
    console.log("beginning restore " + Date.now())
    const user = await User.findById(id);

    if (user.lives < 5) {
      console.log("pre user save restore " + Date.now())
      user.lives += 1;

      if (user.lives < 5) {
        user.nextLifeRestore = new Date(Date.now() + 60 * 1000); 
      } else {
        
        user.nextLifeRestore = null; // No timer needed
      }

      await user.save();
      console.log("post user save restore " + Date.now())
      const loggedInUserSocketId = await redisClient.get(`socketID:${id}`);
      console.log("restore lives-decrease event to be emitted with params: " + user.lives + " " + user.nextLifeRestore + Date.now())
        io.to(loggedInUserSocketId).emit('lives-decrease', {
        livesLeft: user.lives,
        restoreTime: user.nextLifeRestore,
      });
    }
  });
})

instrument(io, {auth: false})

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

// Routes
app.get('/', (req, res) => {
  res.render('index.ejs', { title: 'Welcome', user: { name: 'Alice' }, items: ['Item 1', 'Item 2'] });
});

app.use('/auth', authRouter);
app.use('/friends', friendsRouter);
app.use('/users', usersRouter);
app.use('/notifications', notificationsRouter);
app.use('/games', gamesRouter);

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});



module.exports = { cloudinary };
