const { redisConnect, redisClient } = require('../redisConnection');

const livesSetter = async (req, res, next) => {
    const userID = req.cookies?.user_id;
    let lives = await redisClient.get(`lives-${userID}`)
    let lifeRestore = await redisClient.get(`lifeRestore-${userID}`)
    res.locals.lives = lives ? lives : undefined
    res.locals.nextLifeRestore = lifeRestore ? lifeRestore : undefined
    next()
}


module.exports = { livesSetter }