const express = require('express')
const router = express.Router()
const User = require('../data/User')
const Game = require('../data/Game')
const GameSession = require('../data/GameSession')
const Notification = require('../data/Notification')
const { redisConnect, redisClient } = require('../redisConnection');

router.route("/all").get(async (req, res) =>{
    const userId = req.cookies.user_id;

    try {
      //const user = await User.findById(userId);
        //console.log(user)
        games = await Game.find()
       const user = await User.findById(userId)
        .populate({
          path: 'friends',
          options: { limit: 10 }, // Limit the populated friends to 10
          select: '_id name profilePicture', // Select specific fields from the friend documents
        })
        .exec();
        console.log(console.log(Array.isArray(user.friends)));
      res.render('allGames', {
        lives: user.lives,
        nextLifeRecoveryTime: user.nextLifeRestore,
        games: games, 
        friends: user.friends
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
})

router.route("/lose").post(async (req, res) =>{
    //const userId = req.cookies.user_id;
    const {userId} = req.body
    try {
        console.log("beginning lose " + Date.now())
      const user = await User.findById(userId);
      user.lives = user.lives - 1
      if (user.lives < 5 && !user.nextLifeRestore) {
        user.nextLifeRestore = new Date(Date.now() + 60 * 1000); // 1 minute from now
      }
      console.log("user pre save lose " + Date.now())
      await user.save(); 
      console.log("user post save lose " + Date.now())
          const loggedInUserSocketId = await redisClient.get(`socketID:${userId}`);
          console.log(user)
          console.log("user post redis lose " + Date.now())
          if (loggedInUserSocketId) {
            
            const io = req.app.get('io');
            console.log("lose lives-decrease event to be emitted with params: " + user.lives + " " + user.nextLifeRestore + " " + Date.now())
            io.to(loggedInUserSocketId).emit('lives-decrease', {
              livesLeft: user.lives,
              restoreTime: user.nextLifeRestore,
            });
            res.status(200).send('OK')
        }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }

})

router.route('/start').post(async (req,res) => {
    const {gameId, gameName, players} = req.body
    console.log(gameName)
    console.log(gameId)
    playersParsed = JSON.parse(players)
    const currentUserId = req.cookies.user_id;
    const user = await User.findById(currentUserId)
    const gameSession = new GameSession({gameId:gameId});
    await gameSession.save();
    const io = req.app.get('io');
    io.emit('room-created', gameSession._id)
    playersParsed.forEach(async (player) => {
        const playerSocketId = await redisClient.get(`socketID:${player}`);
        console.log("Player " + player)
        console.log("player socket: " + playerSocketId)
         const notification = new Notification({
                    sender: currentUserId,
                    recepient: player,
                    message: `You have been invited to play Tic Tac Toe with ${user.name}. Join the game <a href="http://localhost:3000/tictactoe/play/${gameSession._id}">here</a>`,
                  });
                  await notification.save();
        io.to(playerSocketId).emit('invite-game-request', {
            message: `You have been invited to play Tic Tac Toe with ${user.name}. Join the game <a href="http://localhost:3000/tictactoe/play/${gameSession._id}">here</a>`,
          });
        /*io.of("/").adapter.on("join-room", (room, playerSocketId) => {
            console.log(`socket ${playerSocketId} has joined room ${room}`);
          });*/
    });
    const rooms = io.of("/").adapter.rooms;
    const sids = io.of("/").adapter.sids;
    console.log(rooms)
    console.log(sids)
    res.redirect(`/${gameName}/play/${gameSession._id}`)
   
}) 





module.exports = router