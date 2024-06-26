const mongoose = require('mongoose')

const actSchema = new mongoose.Schema({
  institutionName: String,
  index: String,
  type: {
    type: String,
    default: 'act',
  },
  judgements: String,
  notification: String,
  title: String,
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
  },
  lastModifiedDate: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: String,
  },
})

const Acts = mongoose.model('Acts', actSchema)

module.exports = Acts
