const express = require('express')
const http = require('http')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const socketIo = require('socket.io')
const multer = require('multer')
const config = require('./Middleware/config')

const userRoute = require('./Routes/userRoute')
const contentsRoute = require('./Routes/contentsRoute')
const citationRoute = require('./Routes/citationRoute')
const actsRoute = require('./Routes/actsRoute')
const filterRoute = require('./Routes/filterRoute')
const verificationRouter = require('./Routes/verificationRoute')
const contactRouter = require('./Routes/contactFormRoute')
const legalAdviceRoute = require('./Routes/legalAdvice')
const notificationRoute = require('./Routes/notificationRoute')
const studyMaterial = require('./Routes/studyMaterialRoute')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

app.use(bodyParser.json({ limit: '15mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }))

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

// Define the storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({ storage })

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` })
})

// Socket.io configuration
io.on('connection', (socket) => {
  console.log('New client connected')

  socket.on(
    'sendMessage',
    async ({ senderId, receiverId, message, attachment }) => {
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        message,
        attachment,
      })
      await newMessage.save()
      io.emit('message', newMessage)
    }
  )

  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})

app.use('/api/solve_litigation/auth/', userRoute)
app.use('/api/solve_litigation/contents/', contentsRoute)
app.use('/api/solve_litigation/citation/', citationRoute)
app.use('/api/solve_litigation/act/', actsRoute)
app.use('/api/solve_litigation/filter/', filterRoute)
app.use('/api/solve_litigation/verification/', verificationRouter)
app.use('/api/solve_litigation/contact/', contactRouter)
app.use('/api/solve_litigation/legal-advice/', legalAdviceRoute)
app.use('/api/solve_litigation/notification/', notificationRoute)
app.use('/api/solve_litigation/study-material/', studyMaterial)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
