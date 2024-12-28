const express = require('express')
const router = express.Router()
const { redisConnect, redisClient } = require('../redisConnection');
const Notification = require('../data/Notification')

router.route('/list').get(async (req, res) => {
    try {
      const userID = req.cookies?.user_id;
      if(userID) {
        const notifications = await Notification.find({ recepient: userID }).populate('sender', 'name profilePicture').sort({ createdAt: -1 });
        console.log(notifications)
        res.render('list-notifications', { notifications: notifications }); 
      }
      else {
        res.status(500).json({ message: 'No user ID' });
      }
      
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.route("/:id/read").get(async (req, res) => {
    try {
        const notificationID = req.params.id
        const userID = req.cookies?.user_id
        if(notificationID){
            const notification = await Notification.findById(notificationID)
            if(notification){
                notification.read = true
                await notification.save()

                const socketId = await redisClient.get(`socketID:${userID}`);
                console.log(socketId)
                if (socketId) {
                    const io = req.app.get('io');
                    io.to(socketId).emit('notification-read', {
                        message: `Notification with id ${notificationID} read`,
                        notificationID: notification._id
                });
          }
                res.status(200).json({ message: 'Notification read successfully.' });
            }
            else{
                res.status(400).json({ message: 'No notification found' });
            }
        }
        
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
})

module.exports = router;