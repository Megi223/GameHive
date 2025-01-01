const express = require('express');
const User = require('../data/User');
const app = express();
const router = express.Router()
const { redisConnect, redisClient } = require('../redisConnection');

router.route('/play/:id').get(async (req,res) => {
    res.status(200).json("in game")
})

module.exports = router
