const mongoose = require('mongoose')

const questionAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
})

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
})

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  chapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
    },
  ],
})

const Topic = mongoose.model('Topic', topicSchema)
const Chapter = mongoose.model('Chapter', chapterSchema)
const QuestionAnswer = mongoose.model('QuestionAnswer', questionAnswerSchema)

module.exports = { Topic, Chapter, QuestionAnswer }
