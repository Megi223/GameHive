const express = require('express')
const router = express.Router()

router.route('/login')
    .get((req,res)=>{
        console.log('login route')
})
    .post((req,res)=>{

})

router.get('/register', (req,res)=>{
    
})

module.exports = router