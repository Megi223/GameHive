const express = require('express')
const mongoose = require('mongoose')
const User = require("./data/User")

const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('./config/cloudinaryConfig');
const dbConfig = require('./config/dbConfig');

mongoose.connect(dbConfig.connectionString).catch(error => console.log(error))
const app = express()
// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
});


app.use(express.static('public'))
// allows access information coming from forms / body of the request
app.use(express.urlencoded({extended:true}))

app.set('view engine', 'ejs')

app.get('/', (req,res) => {
    console.log('Here')
    res.render('index.ejs', { title: 'Welcome', user: { name: 'Alice' }, items: ['Item 1', 'Item 2'] });
})

const authRouter = require('./routes/auth')

app.use('/auth', authRouter)

module.exports = cloudinary;

app.listen(3000)