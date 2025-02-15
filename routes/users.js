const express = require('express')
const router = express.Router()
const User = require('../data/User')
const GameSession = require('../data/GameSession')

router.route('/my-profile').get(async (req, res) => {
    const id = req.cookies?.user_id;
    try {
      const user = await User.findById(id).select('_id name email profilePicture');
        
      if (!user) {
        return res.status(404).send('User not found');
      }
      
      res.render('my-profile', { user  });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

router.route('/:id').get(async (req, res) => {
    const { id } = req.params;
    const loggedInUserID = req.cookies?.user_id;
    try {
      const user = await User.findById(id).select('name email profilePicture pendingRequests');
      const loggedInUser = await User.findById(loggedInUserID)
      if(loggedInUser.pendingRequests.includes(id)){
        user.relationship = 'Pending friend request'
      }
      else if(loggedInUser.friends.includes(id)){
        user.relationship = 'Friends'
      }
      else if(user.pendingRequests.includes(loggedInUserID)){
        user.relationship = 'Friend request sent'
      }
      else {
        user.relationship = 'Add friend'
      }
      if (!user) {
        return res.status(404).send('User not found');
      }
      
      const gamesPlayed = await GameSession.find({
        $and: [
          { players: { $elemMatch: { userId: loggedInUserID } } },
          { players: { $elemMatch: { userId: id } } }
        ]
      })
        .populate('players', 'name')
        .populate('gameId', 'name') 
        .populate('winner', 'name profilePicture')
        .sort({ createdAt: -1 });
        console.log(gamesPlayed)
      res.render('profile', { user, gamesPlayed });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  


  module.exports = router