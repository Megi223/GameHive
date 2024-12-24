const express = require('express')
const app = express()

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

app.listen(3000)