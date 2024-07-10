const express = require('express')
const Topic = require('../Models/StudyMaterial')
const adminAuth = require('../Middleware/adminAuth')
const staffAuth = require('../Middleware/staffAuth')
const userAuth = require('../Middleware/userAuth')
const mongoose = require('mongoose')

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

      const newQuestion = {
        question,
        answer,
        topicId,
      }

      topic.questions.push(newQuestion)
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
studyMaterialRoute.get('/questions/:pageNumber', userAuth, async (req, res) => {
  const { pageNumber } = req.params
  const limit = 10

  // Convert pageNumber to an integer and set a default of 0 if it's not a valid number
  const page = parseInt(pageNumber, 10) || 0
  const skip = page * limit

  try {
    const countResult = await Topic.aggregate([
      { $unwind: '$questions' },
      { $count: 'total' },
    ])
    const totalQuestions = countResult.length > 0 ? countResult[0].total : 0
    const totalPages = Math.ceil(totalQuestions / limit)

    if (page >= totalPages) {
      return res.status(400).json({ error: 'Page number out of range' })
    }

    const questions = await Topic.aggregate([
      { $unwind: '$questions' },
      {
        $project: {
          _id: '$questions._id',
          question: '$questions.question',
          answer: '$questions.answer',
          topicId: '$questions.topicId',
        },
      },
      { $skip: skip },
      { $limit: limit },
    ])

    res.status(200).json({
      questions,
      currentPage: page,
      totalPages,
      totalQuestions,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Route to filter question-answers by topic with pagination
studyMaterialRoute.get(
  '/topics/:topicId/questions/:pageNumber',
  userAuth,
  async (req, res) => {
    const { topicId, pageNumber } = req.params
    const limit = 10

    try {
      const topic = await Topic.findById(topicId)

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' })
      }

      const totalQuestions = topic.questions.length
      const totalPages = Math.ceil(totalQuestions / limit)

      // Validate pageNumber to ensure it's within the valid range
      const page = parseInt(pageNumber, 10) || 1
      if (page < 1 || page > totalPages) {
        return res.status(400).json({ error: 'Page number out of range' })
      }

      // Calculate the range of questions to return based on pagination
      const start = (page - 1) * limit
      const end = start + limit
      const questions = topic.questions.slice(start, end)

      res.status(200).json({
        questions,
        currentPage: page,
        totalPages,
        totalQuestions,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Route to get a specific question-answer for a topic
studyMaterialRoute.get(
  '/topics/:topicId/question/:questionId',
  userAuth,
  async (req, res) => {
    const { topicId, questionId } = req.params

    try {
      // Find the topic containing the asking question
      const topic = await Topic.findById(topicId)
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' })
      }

      // Find the asking question
      const question = topic.questions.id(questionId)
      if (!question) {
        return res.status(404).json({ error: 'Question not found' })
      }

      // Get the IDs of all questions in the topic
      const questionIds = topic.questions.map((question) =>
        question._id.toString()
      )

      // Remove the ID of the asking question from the list
      const filteredQuestionIds = questionIds.filter((id) => id !== questionId)

      // Select a random sample of 5 question IDs from the filtered list
      const randomQuestionIds = filteredQuestionIds
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)

      // Find the 5 related questions
      const relatedQuestions = topic.questions
        .filter((question) =>
          randomQuestionIds.includes(question._id.toString())
        )
        .map(({ _id, question }) => ({ _id, question, topicId }))

      // Return the asking question and the related questions
      res.status(200).json({
        question,
        relatedQuestions,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

studyMaterialRoute.get('/search-questions', userAuth, async (req, res) => {
  try {
    const query = req.query.query

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' })
    }

    const matchedQuestions = await Topic.aggregate([
      {
        $match: {
          $or: [
            { topic: { $regex: query, $options: 'i' } },
            { 'questions.question': { $regex: query, $options: 'i' } },
            { 'questions.answer': { $regex: query, $options: 'i' } },
          ],
        },
      },
      {
        $unwind: '$questions',
      },
      {
        $match: {
          $or: [
            { topic: { $regex: query, $options: 'i' } },
            { 'questions.question': { $regex: query, $options: 'i' } },
            { 'questions.answer': { $regex: query, $options: 'i' } },
          ],
        },
      },
      {
        $project: {
          _id: '$questions._id',
          question: '$questions.question',
          answer: '$questions.answer',
          topicId: '$_id',
          topic: 1,
        },
      },
    ])

    res.status(200).json(matchedQuestions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = studyMaterialRoute
