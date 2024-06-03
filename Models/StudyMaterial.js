const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
})

const topicSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
  },
  questions: [questionSchema],
})

const Topic = mongoose.model('Topic', topicSchema)

module.exports = Topic
