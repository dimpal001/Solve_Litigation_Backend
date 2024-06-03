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
    const topics = await Topic.find().select('topic')
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

      res.status(201).json(topic)
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

module.exports = studyMaterialRoute
