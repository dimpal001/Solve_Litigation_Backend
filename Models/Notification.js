const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  citationId: { type: String, required: true },
})

const Notification = mongoose.model('Notification', notificationSchema)
module.exports = Notification
