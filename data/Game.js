const gameSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, 
    description: { type: String }, 
    rules: { type: String }, 
    maxPlayers: { type: Number, default: 2 }, 
    createdAt: { type: Date, default: Date.now },
  });
  
  const Game = mongoose.model('Game', gameSchema);
  module.exports = Game;