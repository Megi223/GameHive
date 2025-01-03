const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const User = require("./data/User");
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

  socket.on('user-joined', async (room, userID) => {
    socket.join(room)
    await redisClient.set(`room:${userID}`, room, { EX: 24 * 60 * 60 });
    let peopleIn = 1;
    peopleIn = await redisClient.get(room)
    console.log(peopleIn)
    if(peopleIn != null){
      peopleIn = parseInt(peopleIn) + 1
     await redisClient.set(`${room}`, peopleIn, { EX: 24 * 60 * 60 });
     io.to(socket.id).emit('player-symbol-assigned', { symbol: 'O' })
     await redisClient.set(`${userID};${room}`, 'O', { EX: 24 * 60 * 60 });
    }
    else{
      await redisClient.set(`${room}`, 1, { EX: 24 * 60 * 60 });
      io.to(socket.id).emit('player-symbol-assigned', { symbol: 'X' })
      await redisClient.set(`${userID};${room}`, 'X', { EX: 24 * 60 * 60 });
    }
    console.log("to emit user count")
    
    
    io.to(room).emit('user-count', { userCount: peopleIn })
  })

  socket.on('make-move', async ({index, room, move, board}) => {
    /*console.log("Index is: " + index)
    console.log(room)
    console.log(move)
    console.log(board)*/
    //const { index, room } = data;
    const userID = socket.handshake.auth.userID;
    console.log(userID)
    const roomID = await redisClient.get(`room:${userID}`);
    //const expectedMove = await redisClient.get(`${userID};${room}`)
    const expectedMove = (Object.values(board).filter(cell => cell.value === '').length) % 2 == 1 ? 'X' : 'O';
    /*console.log("Expected move is: " + expectedMove)
    console.log(board[index].value === '')
    console.log(roomID === room)
    console.log(expectedMove === move)*/
    // Validate move 
    if (board[index].value === '' && roomID === room && expectedMove === move) {
      console.log("in board assignment")
      board[index].value = move;
      move = move === 'X' ? 'O' : 'X'; // Switch player
      
      // Check for a winner or draw
      const winner = checkWinner(board);
      console.log(winner)
      if (winner) {
        console.log('game over to be emitted with '+ winner)
        io.to(room).emit('game-over', { board, winner });
        
      } else if (Object.values(board).every((cell) => cell.value !== '')) {
        console.log('game over to be emitted with draw')
        console.log(Object.values(board).every((cell) => console.log(cell)))
        io.to(room).emit('game-over', { board, winner: 'Draw' });
      } else {
        console.log('game update to be emitted with '+ board + ' ' + move)
        io.to(room).emit('game-update', { board, move });
      }
    }
  });

  function checkWinner(board) {
    console.log('in check winner')
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a].value && board[a].value === board[b].value && board[a].value === board[c].value) {
        return board[a].value; // Return 'X' or 'O'
      }
    }
    return null;
  }
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
app.use('/TicTacToe', tictactoe)

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

module.exports = { cloudinary };
