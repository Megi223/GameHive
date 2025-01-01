const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSessionSchema = new Schema({
  gameId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Game', 
        required: true 
  },
  players: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  score: { type: Number, default: 0 },  
  status: { type: String, enum: ['in-progress', 'completed', 'cancelled'], default: 'in-progress' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
  createdAt: { type: Date, default: Date.now, immutable:true },  
  completedAt: { type: Date },              
});

const GameSession = mongoose.model('GameSession', gameSessionSchema);
module.exports = GameSession;