const express = require('express');
const User = require('../data/User');
const app = express();
const router = express.Router()
const { redisConnect, redisClient } = require('../redisConnection');

router.route('/play/:id').get(async (req,res) => {
    //res.status(200).json("in game")
    const gameId = req.params.id
    const io = req.app.get('io');
    const userID = req.cookies.user_id;
    const loggedUserSocketId = await redisClient.get(`socketID:${userID}`);
    res.render('tictactoe.ejs', { gameId: gameId})




})




module.exports = router
