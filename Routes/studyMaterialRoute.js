const express = require('express')
const Topic = require('../Models/StudyMaterial')
const adminAuth = require('../Middleware/adminAuth')
const staffAuth = require('../Middleware/staffAuth')
const userAuth = require('../Middleware/userAuth')

const studyMaterialRoute = express.Router()

// Route to add a new topic
studyMaterialRoute.post('/add-topic', adminAuth, async (req, res) => {
  const { topic } = req.body
  try {
    let existingTopic = await Topic.findOne({ topic })

    if (existingTopic) {
      return res.status(400).json({ error: 'Topic already exists' })
    }

    const newTopic = new Topic({ topic })
    await newTopic.save()

    res.status(201).json(newTopic)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Route to get all topic names
studyMaterialRoute.get('/topics', userAuth, async (req, res) => {
  try {
    const topics = await Topic.aggregate([
      {
        $project: {
          topic: 1,
          numberOfQuestions: { $size: '$questions' },
        },
      },
    ])
    res.status(200).json(topics)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Route to add a question-answer to a specific topic
studyMaterialRoute.post(
  '/topics/:topicId/add-question',
  staffAuth,
  async (req, res) => {
    const { topicId } = req.params
    const { question, answer } = req.body

    try {
      let topic = await Topic.findById(topicId)

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' })
      }

      topic.questions.push({ question, answer })
      await topic.save()

      res
        .status(201)
        .json({ topic, message: 'The question-answer has been uploaded!' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Route to get all question-answers for a specific topic
studyMaterialRoute.get(
  '/topics/:topicId/questions',
  userAuth,
  async (req, res) => {
    const { topicId } = req.params

    try {
      let topic = await Topic.findById(topicId)

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' })
      }

      res.status(200).json(topic.questions)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Route to edit a topic
studyMaterialRoute.put('/topics/:topicId', adminAuth, async (req, res) => {
  const { topicId } = req.params
  const { topic } = req.body

  try {
    let existingTopic = await Topic.findById(topicId)

    if (!existingTopic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    // Check if the new topic name already exists
    let duplicateTopic = await Topic.findOne({ topic })
    if (duplicateTopic) {
      return res.status(400).json({ error: 'Topic already exists' })
    }

    existingTopic.topic = topic
    await existingTopic.save()

    res.status(200).json(existingTopic)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Route to update a question/answer
studyMaterialRoute.put(
  '/topics/:topicId/questions/:questionId',
  staffAuth,
  async (req, res) => {
    const { topicId, questionId } = req.params
    const { question, answer } = req.body

    try {
      let topic = await Topic.findById(topicId)

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' })
      }

      const questionToUpdate = topic.questions.id(questionId)

      if (!questionToUpdate) {
        return res.status(404).json({ error: 'Question not found' })
      }

      if (question) questionToUpdate.question = question
      if (answer) questionToUpdate.answer = answer

      await topic.save()

      res.status(200).json(topic)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Route to delete a question/answer
studyMaterialRoute.delete(
  '/topics/:topicId/questions/:questionId',
  staffAuth,
  async (req, res) => {
    const { topicId, questionId } = req.params

    try {
      // Use findByIdAndUpdate with $pull to remove the question by its ID
      const topic = await Topic.findByIdAndUpdate(
        topicId,
        { $pull: { questions: { _id: questionId } } },
        { new: true }
      )

      if (!topic) {
        console.error(`Topic with ID ${topicId} not found`)
        return res.status(404).json({ error: 'Topic not found' })
      }

      res.status(200).json({ message: 'Question deleted successfully' })
    } catch (error) {
      console.error('Error deleting question:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Route to delete a topic
studyMaterialRoute.delete('/topics/:topicId', adminAuth, async (req, res) => {
  const { topicId } = req.params

  try {
    const topic = await Topic.findByIdAndDelete(topicId)

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    res.status(200).json({ message: 'Topic deleted successfully' })
  } catch (error) {
    console.error('Error deleting topic:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Route to get all question-answers with pagination
studyMaterialRoute.get('/questions', userAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query

  try {
    const questions = await Topic.aggregate([
      { $unwind: '$questions' },
      {
        $project: {
          question: '$questions.question',
          answer: '$questions.answer',
          topic: '$topic',
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
    ])

    res.status(200).json(questions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Route to filter question-answers by topic with pagination
studyMaterialRoute.get(
  '/topics/:topicId/questions',
  userAuth,
  async (req, res) => {
    const { topicId } = req.params
    const { page = 1, limit = 20 } = req.query

    try {
      const topic = await Topic.findById(topicId)

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' })
      }

      const questions = topic.questions.slice((page - 1) * limit, page * limit)

      res.status(200).json(questions)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

module.exports = studyMaterialRoute
