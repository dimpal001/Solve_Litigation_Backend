const express = require('express')
const Citation = require('../Models/Citation')
const Notification = require('../Models/Notification')
const adminAuth = require('../Middleware/adminAuth')

const notificationRoute = express.Router()

notificationRoute.post('/', adminAuth, async (req, res) => {
  try {
    const { title, link, citationId } = req.body

    const existingNotification = await Notification.findOne({ citationId })

    if (existingNotification) {
      return res
        .status(400)
        .json({ error: 'Notification for this citation already exists.' })
    }

    const newNotification = new Notification({
      title: title,
      link: link,
      citationId: citationId,
    })

    await newNotification.save()

    res.status(201).json({ message: 'Notification has been added.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

notificationRoute.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find()

    res.status(201).json(notifications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

notificationRoute.delete('/:id', async (req, res) => {
  try {
    const isDeleted = await Notification.findByIdAndDelete(req.params.id)

    if (!isDeleted) {
      res.status(201).json({ error: 'The notification is not found' })
    }

    if (isDeleted) {
      res.status(201).json({ message: 'The notification has been deleted' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = notificationRoute
