const mongoose = require("mongoose")
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: String,
    password: {
        type: String,
        required:true,
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function (email) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
              },
              message: props => `${props.value} is not a valid email address!`
        }
    },
    lives: { type: Number, default: 5, max: 5 },
    nextLifeRestore: { type: Date },
    points: { type: Number, default: 0 },
    lastSpinDate: { type: Date },
    level: { type: Number, default: 1},
    gamesPlayed: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'GameSession', // Reference to game sessions
        },
    ],
    createdAt: { type: Date, default: Date.now, immutable:true },
    friends: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', 
        },
    ],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    profilePicture: {
        type: String,
        default: 'https://res.cloudinary.com/dhsnrnzzt/image/upload/v1735133860/avatar-2_pipnta.jpg', 
        validate: {
          validator: function (url) {
            return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg))$/i.test(url);
          },
          message: props => `${props.value} is not a valid image URL!`,
        },
    },
})

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

const User = mongoose.model("User", userSchema)
module.exports = User;