const express = require('express')
const messageRouter = express.Router()
const User = require('../Models/User')
const Message = require('../Models/Message')
const fs = require('fs')

const app = express()
const http = require('http')

const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage })

// Send message route
messageRouter.post(
  '/send-attachment',
  upload.single('attachment'),
  async (req, res) => {
    const { from, to } = req.body
    let attachment = ''

    if (req.file) {
      attachment = req.file.filename
    }

    try {
      const newMessage = new Message({
        from,
        to,
        text: '',
        attachment,
        createdAt: new Date(),
      })
      await newMessage.save()

      req.io.emit('refreshMessage', {
        message: 'Refresh called.',
      })

      res
        .status(200)
        .json({ message: 'Attachment sent successfully', newMessage })
    } catch (error) {
      console.error('Error sending message:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)
// Download Attachment route
messageRouter.get('/download/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(__dirname, '../uploads', filename)

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Provide the file for download
    res.sendFile(filePath)
  } else {
    // File not found
    res.status(404).json({ error: 'File not found' })
  }
})

// DELETE route to delete a message and its attachment (if any)
messageRouter.delete('/delete-message/:messageId', async (req, res) => {
  const messageId = req.params.messageId

  try {
    // Find the message by ID
    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Delete the attachment file if it exists
    if (message.attachment) {
      const filePath = path.join(__dirname, '../uploads', message.attachment)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // Delete the message from the database
    await Message.findByIdAndDelete(messageId)

    req.io.emit('refreshMessage', {
      message: 'Refresh Called.',
    })

    res.status(200).json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error deleting message:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

messageRouter.get('/lawyer-list', async (req, res) => {
  try {
    const lawyerList = await User.find({ userType: 'lawyer' })
    res.status(200).json(lawyerList)
  } catch (error) {
    console.log('Error in lawyer list controller: ', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET old message between two users
messageRouter.get('/:fromUser/:toUser', async (req, res) => {
  try {
    const { fromUser, toUser } = req.params
    const messages = await Message.find({
      $or: [
        { from: fromUser, to: toUser },
        { from: toUser, to: fromUser },
      ],
    }).sort({ createdAt: 1 })

    const user = await User.findOne({ _id: toUser })

    res.status(200).json({ messages: messages, user: user })
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Send a new message
// messageRouter.post('/send-message', async (req, res) => {
//   const { from, to, text } = req.body

//   try {
//     const newMessage = new Message({ from, to, text, createdAt: new Date() })
//     await newMessage.save()

//     res.status(200).json({ message: 'Message sent successfully', newMessage })
//   } catch (error) {
//     console.error('Error sending message:', error)
//     res.status(500).json({ error: 'Internal server error' })
//   }
// })

// GET list of users with whom the current user has chatted
messageRouter.get('/chatted-users', async (req, res) => {
  try {
    const toUserId = req.query.userId
    console.log('Receiver ID : ', toUserId)

    // Find messages where 'to' field matches the provided userId
    const messages = await Message.find({ to: toUserId })
      .populate('from', 'fullName specialist state district') // Populate 'from' field with user details
      .exec()

    // Use a Map to store unique fromUsers based on _id
    const uniqueFromUsersMap = new Map()
    messages.forEach((message) => {
      if (!uniqueFromUsersMap.has(message.from._id.toString())) {
        uniqueFromUsersMap.set(message.from._id.toString(), {
          _id: message.from._id,
          fullName: message.from.fullName,
          specialist: message.from.specialist,
          state: message.from.state,
          district: message.from.district,
        })
      }
    })

    // Convert Map values to array
    const fromUsers = Array.from(uniqueFromUsersMap.values())

    res.json(fromUsers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error })
  }
})

module.exports = messageRouter
