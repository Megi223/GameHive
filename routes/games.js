const express = require('express')
const router = express.Router()
const User = require('../data/User')
const Notification = require('../data/Notification')
const { redisConnect, redisClient } = require('../redisConnection');

router.route("/all").get(async (req, res) =>{
    const userId = req.cookies.user_id;

    try {
      const user = await User.findById(userId);
        console.log(user)
      res.render('allGames', {
        lives: user.lives,
        nextLifeRecoveryTime: user.nextLifeRestore,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
})

router.route("/lose").get(async (req, res) =>{
    const userId = req.cookies.user_id;

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
            
        }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }

})



module.exports = router