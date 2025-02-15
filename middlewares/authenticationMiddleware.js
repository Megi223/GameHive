const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const authenticateToken = (req, res, next) => {
    const token = req.cookies?.access_token; 
    console.log("in authentication middleware")
    if (!token) {
      console.log("no access token")
      next()
      return;
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, async (err, user) => {
        if (err) {
          const refreshToken = req.cookies?.refresh_token;
          const userID = req.cookies?.user_id;
          const response = await fetch('http://localhost:3000/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: refreshToken,
              userID: userID
            }),
          });
          
          if(response.ok){
            
            const data = await response.json();
            const newAccessToken = data.accessToken; 
            console.log("New access token " + newAccessToken)
            jwt.verify(newAccessToken, ACCESS_TOKEN_SECRET, async (err,user) => {
              req.user = user;
              res.cookie('access_token', newAccessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
            }) 
          }
          else{
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
            res.clearCookie("user_id");
            res.redirect('/auth/login')
          }
          
        }
        else{
          req.user = user;
        }
        console.log("==USER==")
        console.log(req.user)
        next();
    });
};

module.exports = { authenticateToken };