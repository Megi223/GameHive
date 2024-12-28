const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const authenticateToken = (req, res, next) => {
    const token = req.cookies?.access_token; 
    
    if (!token) {
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
            jwt.verify(newAccessToken, ACCESS_TOKEN_SECRET, async (err,user) => {
              req.user = user;
              res.cookie('access_token', newAccessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
            }) 
          }
          
        }
        else{
          req.user = user;
        }
        next();
    });
};

module.exports = { authenticateToken };