const Notification = require('../data/Notification')

const assignNotifications = async (req, res, next) => {
    if (req.cookies?.user_id) {
      const userID = req.cookies.user_id;
  
      // Fetch the count of unread notifications
      const notificationsCount = await Notification.countDocuments({ recepient: userID, read: false });
  
      res.locals.notificationsCount = notificationsCount;
    } 
    next();
}

module.exports = { assignNotifications }