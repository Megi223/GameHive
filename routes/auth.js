const express = require('express')
const router = express.Router()
const User = require('../data/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const { redisClient } = require('../redisConnection');
require('dotenv').config();

router.route('/login')
    .get((req,res)=>{
        res.render("login.ejs")
})
    .post(async (req,res)=>{
      try {
        const {email, password} = req.body
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const accessToken = generateAccessToken(user.toJSON())
        const refreshToken = generateRefreshToken(user.toJSON())
        await redisClient.set(`accessToken:${user.id}`, accessToken, { EX: 5 * 60 });
        await redisClient.set(`refreshToken:${user.id}`, refreshToken, { EX: 24 * 60 * 60 });
        
        res.cookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.cookie('user_id', user.id, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.redirect("/users/my-profile")
      }
      catch(err){
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
        

})

router.route('/register').get((req,res)=>{
    res.render("register.ejs")
}).post(async (req,res)=>{

    const {email,password,name, profilePicture} = req.body
    try {
        const user = new User({ email, password, name, profilePicture });
        await user.save();

        res.redirect("/auth/login");
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})



const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

router.post('/token', async (req, res) => {
  const { refreshToken, userID } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh Token Required' });
  }

  try {
    const storedToken = await redisClient.get(`refreshToken:${userID}`);
    if (!storedToken) {
      return res.status(403).json({ message: 'Invalid Refresh Token', redirect: '/auth/login' });
    }
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {

      console.log("Token verification failed:", err.message);
      return res.status(403).json({ message: "Invalid or expired refresh token", redirect: '/auth/login' });
    }
    
    const user = await User.findById(userID);
    const newAccessToken = generateAccessToken(user.toJSON())
    //const newRefreshToken = generateRefreshToken(user.toJSON())
    await redisClient.set(`accessToken:${userID}`, newAccessToken, { EX: 5 * 60 });
    //await redisClient.set(`refreshToken:${user.id}`, refreshToken, { EX: 24 * 60 * 60 });
    
    res.cookie('access_token', newAccessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: 'Refresh Token Invalid or Expired', redirect:'/auth/login' });
  }
});

router.route('/logout')
    .post(async (req, res) => {
  const userID = req.cookies?.user_id;
  const user = await User.findById(userID);
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.clearCookie("user_id");
  await redisClient.del(`accessToken:${userID}`);
  await redisClient.del(`refreshToken:${userID}`);
  res.redirect("/")
})

function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '300s' })
}

function generateRefreshToken(user){
  return jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '1d' })
}

module.exports = router