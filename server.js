const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('./Middleware/config')
const morgan = require('morgan')
const http = require('http')
const socketIo = require('socket.io')
const multer = require('multer')
const path = require('path')

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
const message = require('./Routes/messageRoute')
const Message = require('./Models/Message')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: 'https://chat.solvelitigation.com',
    methods: ['GET', 'POST'],
  },
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({ storage: storage })

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
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
app.use('/api/solve_litigation/message/', message)

// Keep track of users and their sockets
const users = {}

io.on('connection', (socket) => {
  console.log('New client connected')

  // Store the connected user's socket ID
  socket.on('register', (userId) => {
    users[userId] = socket.id
  })

  socket.on('sendMessage', async ({ from, to, text }) => {
    const newMessage = new Message({
      from,
      to,
      text,
      createdAt: new Date(),
    })

    // Save the message without the attachment first
    await newMessage.save()

    const recipientSocket = users[to]
    if (recipientSocket) {
      io.to(recipientSocket).emit('receiveMessage', {
        from,
        text,
        createdAt: newMessage.createdAt,
      })
    }
  })

  socket.on('sendAttachment', upload.single('attachment'), async (req, res) => {
    const { from, to, text } = req.body
    const attachmentFilename = req.file ? req.file.filename : null

    const newMessage = new Message({
      from,
      to,
      text,
      attachment: attachmentFilename,
      createdAt: new Date(),
    })
    await newMessage.save()

    const recipientSocket = users[to]
    if (recipientSocket) {
      io.to(recipientSocket).emit('receiveMessage', {
        from,
        text,
        attachment: attachmentFilename,
        createdAt: newMessage.createdAt,
      })
    }
    res.status(200).send('Attachment sent and message saved.')
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected')
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId]
        break
      }
    }
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
