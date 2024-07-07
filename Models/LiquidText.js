const mongoose = require('mongoose')

const liquidTextSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userDetails: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  file: {
    fileName: {
      type: String,
      required: true,
    },
  },
  liquidText: [
    {
      type: String,
      required: true,
    },
  ],
})

const LiquidText = mongoose.model('LiquidText', liquidTextSchema)

module.exports = LiquidText
