const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('./Middleware/config')
const morgan = require('morgan')
const userRoute = require('./Routes/userRoute')
const contentsRoute = require('./Routes/contentsRoute')
const citationRoute = require('./Routes/citationRoute')
const actsRoute = require('./Routes/actsRoute')
const filterRoute = require('./Routes/filterRoute')
const verificationRouter = require('./Routes/verificationRoute')
const contactRouter = require('./Routes/contactFormRoute')
const legalAdviceRequestRouter = require('./Routes/legalAdviceRequests')

const app = express()

app.use(bodyParser.json({ limit: '15mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }))

app.use(bodyParser.json())
app.use(morgan('dev'))
app.use(cors())

mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

app.use('/api/solve_litigation/auth/', userRoute)
app.use('/api/solve_litigation/contents/', contentsRoute)
app.use('/api/solve_litigation/citation/', citationRoute)
app.use('/api/solve_litigation/act/', actsRoute)
app.use('/api/solve_litigation/filter/', filterRoute)
app.use('/api/solve_litigation/verification/', verificationRouter)
app.use('/api/solve_litigation/contact/', contactRouter)
app.use('/api/solve_litigation/legal-advice/', legalAdviceRequestRouter)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
