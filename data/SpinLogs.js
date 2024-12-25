const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const spinLogSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    spinDate: { type: Date, required: true }, 
    reward: {
      type: new Schema({
        type: { type: String, enum: ['points', 'lives'], required: true }, 
        amount: { type: Number, required: true }, 
      }),
    },
    createdAt: { type: Date, default: Date.now },
  });
  
const spinLog = mongoose.model('SpinLog', spinLogSchema);
module.exports = spinLog;