const express = require('express')
const router = express.Router()
const User = require('../data/User')


router.route('/my-profile').get(async (req, res) => {
    const id = req.cookies?.user_id;
    try {
      const user = await User.findById(id).select('_id name email profilePicture');
        
      if (!user) {
        return res.status(404).send('User not found');
      }
      
      res.render('my-profile', { user  });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

router.route('/:id').get(async (req, res) => {
    const { id } = req.params;
    try {
      const user = await User.findById(id).select('name email profilePicture');
  
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      res.render('profile', { user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  


  module.exports = router