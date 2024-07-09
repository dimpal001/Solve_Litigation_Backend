const mongoose = require('mongoose')

const argumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
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

const liquidTextSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  clientAddress: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdUser: {
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
  arguments: [argumentSchema],
})

const LiquidText = mongoose.model('LiquidText', liquidTextSchema)

module.exports = LiquidText
