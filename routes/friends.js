const express = require('express')
const router = express.Router()
const User = require('../data/User')
const Notification = require('../data/Notification')
const { redisConnect, redisClient } = require('../redisConnection');

router.route('/list').get(async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate('friends', '_id name profilePicture');
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
      console.log("==========USER========")
      console.log(user)
      console.log("==========FRIEND========")
        console.log(friend)
      if (!friend) {
        return res.status(404).json({ message: 'No user with this friend ID' });
      }
      if(user.friends.includes(friendId)){
        res.status(400).json({ message: 'User is already your friend.' });
      }
      // Add friend to the user's friend list if not already added
      if (!friend.pendingRequests.includes(userID)) {
        friend.pendingRequests.push(userID);
        await friend.save();
        const notification = new Notification({
            sender: userID,
            recepient: friendId,
            message: `${user.name} sent you a friend request`,
          });
          await notification.save();

          const socketId = await redisClient.get(`socketID:${friendId}`);
          const loggedInUserSocketId = await redisClient.get(`socketID:${userID}`);
          console.log(socketId)
          if (socketId) {
            
            const io = req.app.get('io');
            io.to(socketId).emit('friend-request-sent', {
              message: `You have a new friend request from ${user.name}`,
              notificationID: notification._id
            });

            io.to(socketId).emit('change-button-status', {
                message: `Accept/Reject`,
                userID: userID
              });

            io.to(loggedInUserSocketId).emit('change-button-status', {
                message: `Friend request sent`,
              });
          }
      
          
        res.status(200).json({ message: 'Friend request sent successfully.' });
      } else {
        res.status(400).json({ message: 'Friend request has already been sent to this user' });
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
      }

      const friend = await User.findById(friendId);
  
      const indexFriend = friend.friends.indexOf(userID);
      if (index > -1) {
        friend.friends.splice(indexFriend, 1);
        await friend.save();
      } 

      const friendSocketId = await redisClient.get(`socketID:${friendId}`);
      if (friendSocketId) {
            
        const io = req.app.get('io');

        io.to(friendSocketId).emit('change-button-status', {
            message: `Add friend`,
            userID: userID
          });
      }

      res.status(200).json({ message: 'Friend removed successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

    // Search for a friend by username or email
  router.route('/search').get(async (req, res) => {
    const { searchTerm } = req.query;
  
    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required.' });
    }
  
    try {
      // Search for users by username or email
      const userID = req.cookies?.user_id;
      const users = await User.find({
        name: { $regex: `^${searchTerm}`, $options: 'i' }, // Match names starting with the searchTerm
        _id: { $ne: userID }, // Exclude the current user's ID
      })
        .select('_id name email profilePicture')
        .limit(5);
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.route('/accept').post(async (req, res) => {
    console.log("in route")
    const { friendId } = req.body;
  console.log(friendId)
    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required.' });
    }

    const loggedInUserID = req.cookies?.user_id;
    console.log(loggedInUserID)
    try{
        const newFriend = await User.findById(friendId);
        const loggedUser = await User.findById(loggedInUserID);
        console.log("taken users")
        loggedUser.pendingRequests.pull({ _id: friendId })
        loggedUser.friends.push(friendId)
        newFriend.friends.push(loggedInUserID)

        await loggedUser.save()
        await newFriend.save()

        const notification = new Notification({
            sender: loggedInUserID,
            recepient: friendId,
            message: `${loggedUser.name} accepted your a friend request`,
          });
          await notification.save();

          const socketId = await redisClient.get(`socketID:${friendId}`);
          const loggedUserSocketId = await redisClient.get(`socketID:${loggedInUserID}`);
          console.log(socketId)
          if (socketId) {
            
            const io = req.app.get('io');
            io.to(socketId).emit('friend-request-accepted', {
              message: `${loggedUser.name} accepted your friend request`,
              notificationID: notification._id
            });

            io.to(socketId).emit('change-button-status', {
                message: `Friends`,
              });

            io.to(loggedUserSocketId).emit('change-button-status', {
                message: `Friends`,
              });
          }
    }
    catch{
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
    
  })

  router.route('/reject').post(async (req, res) => {
    console.log("in route reject")
    const { friendId } = req.body;
    console.log(friendId)
    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required.' });
    }

    const loggedInUserID = req.cookies?.user_id;
    console.log(loggedInUserID)
    try{
        const rejectedFriend = await User.findById(friendId);
        const loggedUser = await User.findById(loggedInUserID);
        console.log("taken users")
        loggedUser.pendingRequests.pull({ _id: friendId })
        
        await loggedUser.save()
        await rejectedFriend.save()

        const notification = new Notification({
            sender: loggedInUserID,
            recepient: friendId,
            message: `${loggedUser.name} rejected your friend request`,
          });
          await notification.save();

          const socketId = await redisClient.get(`socketID:${friendId}`);
          const loggedUserSocketId = await redisClient.get(`socketID:${loggedInUserID}`);
          console.log(socketId)
          if (socketId) {
            
            const io = req.app.get('io');
            io.to(socketId).emit('friend-request-accepted', {
              message: `${loggedUser.name} rejected your friend request`,
              notificationID: notification._id
            });

            io.to(socketId).emit('change-button-status', {
                message: `Add friend`,
                userID: loggedInUserID
              });

            io.to(loggedUserSocketId).emit('change-button-status', {
                message: `Add friend`,
                userID: friendId
              });
          }
    }
    catch{
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
    
  })

module.exports = router;