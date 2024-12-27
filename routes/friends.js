const express = require('express')
const router = express.Router()
const User = require('../data/User')

router.route('/list').get(async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate('friends', 'name profilePicture');
      res.render('list', { friends: user.friends }); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.route('/add').post(async (req, res) => {
    const { friendId } = req.body;
  
    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required.' });
    }
  
    try {
        const userID = req.cookies?.user_id;
      const user = await User.findById(userID);
      const friend = await User.findById(friendId);
  
      if (!friend) {
        return res.status(404).json({ message: 'No user with this friend ID' });
      }
  
      // Add friend to the user's friend list if not already added
      if (!user.friends.includes(friendId)) {
        user.friends.push(friendId);
        await user.save();
        res.status(200).json({ message: 'Friend added successfully.' });
      } else {
        res.status(400).json({ message: 'User is already your friend.' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.route('/remove').post(async (req, res) => {
    const { friendId } = req.body;
  
    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required.' });
    }
  
    try {
        const userID = req.cookies?.user_id;
      const user = await User.findById(userID);
  
      // Remove friend from the user's friend list
      const index = user.friends.indexOf(friendId);
      if (index > -1) {
        user.friends.splice(index, 1);
        await user.save();
        res.status(200).json({ message: 'Friend removed successfully.' });
      } else {
        res.status(400).json({ message: 'Friend not found in your list.' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
module.exports = router;