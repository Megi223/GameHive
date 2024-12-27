const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recepient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timeSent: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  });
  
  module.exports = mongoose.model('Notification', NotificationSchema);