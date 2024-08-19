const express = require('express')
const mongoose = require('mongoose')
const { Topic, Chapter, QuestionAnswer } = require('../Models/StudyMaterial')
const userAuth = require('../Middleware/userAuth')

const studyMaterialRoute = express.Router()

// Create a new Topic
studyMaterialRoute.post('/topics', async (req, res) => {
  try {
    const topic = new Topic(req.body)
    await topic.save()
    res.status(201).send(topic)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error ' })
  }
})

// Get all Topics
studyMaterialRoute.get('/topics', userAuth, async (req, res) => {
  try {
    const topics = await Topic.find().populate('chapters')
    res.status(200).send(topics)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get a single Topic by ID
studyMaterialRoute.get('/topics/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate('chapters')
    if (!topic) {
      return res.status(404).send()
    }
    res.status(200).send(topic)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update a Topic by ID
studyMaterialRoute.patch('/topics/:id', async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!topic) {
      return res.status(404).send()
    }
    res.status(200).send(topic)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete a Topic by ID
studyMaterialRoute.delete('/topics/:id', async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id)
    if (!topic) {
      return res.status(404).send()
    }
    res.status(200).send(topic)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Create a new Chapter and associate it with a Topic
studyMaterialRoute.post('/chapters', async (req, res) => {
  const { name, topicId } = req.body

  try {
    const topic = await Topic.findById(topicId)
    if (!topic) {
      return res.status(404).send({ error: 'Topic not found' })
    }

    const chapter = new Chapter({ name })
    await chapter.save()

    topic.chapters.push(chapter._id)
    await topic.save()

    res.status(201).send(chapter)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all Chapters
studyMaterialRoute.get('/all-chapters', async (req, res) => {
  try {
    const chapters = await Chapter.find()
    res.status(200).send(chapters)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all Chapters by topicId
studyMaterialRoute.get('/chapters', async (req, res) => {
  try {
    const { topicId } = req.query // Extract topicId from query parameters

    if (!topicId) {
      // If no topicId is provided, return all chapters
      const chapters = await Chapter.find()
      return res.status(200).send(chapters)
    }

    // Find the topic by topicId
    const topic = await Topic.findById(topicId).populate('chapters')

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' })
    }

    // Retrieve chapters associated with the found topic
    const chapters = topic.chapters

    if (!chapters.length) {
      return res
        .status(404)
        .json({ message: 'No chapters found for this topic' })
    }

    res.status(200).send(chapters)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get a single Chapter by ID
studyMaterialRoute.get('/chapters/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
    if (!chapter) {
      return res.status(404).send()
    }
    res.status(200).send(chapter)
  } catch (error) {
    res.status(500).send(error)
  }
})

// Update a Chapter by ID
studyMaterialRoute.patch('/chapters/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!chapter) {
      return res.status(404).send()
    }
    res.status(200).send(chapter)
  } catch (error) {
    res.status(400).send(error)
  }
})

// Delete a Chapter by ID
studyMaterialRoute.delete('/chapters/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id)
    if (!chapter) {
      return res.status(404).send()
    }
    res.status(200).send(chapter)
  } catch (error) {
    res.status(500).send(error)
  }
})

// Create a new QuestionAnswer
studyMaterialRoute.post('/question-answers', async (req, res) => {
  try {
    const questionAnswer = new QuestionAnswer(req.body)
    await questionAnswer.save()
    res.status(201).send(questionAnswer)
  } catch (error) {
    res.status(400).send(error)
  }
})

// Get all QuestionAnswers
studyMaterialRoute.get('/question-answers', async (req, res) => {
  try {
    const questionAnswers = await QuestionAnswer.find().populate('chapters')
    res.status(200).send(questionAnswers)
  } catch (error) {
    res.status(500).send(error)
  }
})

// Get a single QuestionAnswer by ID
studyMaterialRoute.get('/question-answers/:id', async (req, res) => {
  try {
    // Find the requested QuestionAnswer by ID and populate the chapters
    const questionAnswer = await QuestionAnswer.findById(
      req.params.id
    ).populate('chapters')

    if (!questionAnswer) {
      return res.status(404).send()
    }

    // Find other QuestionAnswers that belong to the same chapters, excluding the 'answer' field
    const matchedQuestions = await QuestionAnswer.find({
      chapters: { $in: questionAnswer.chapters },
      _id: { $ne: questionAnswer._id }, // Exclude the current question
    }).select('_id question ') // Select only 'question' and 'chapters' fields

    // Send the response including the requested QuestionAnswer and matched questions
    res.status(200).send({ questionAnswer, matchedQuestions })
  } catch (error) {
    res.status(500).send(error)
  }
})

// Update a QuestionAnswer by ID
studyMaterialRoute.patch('/question-answers/:id', async (req, res) => {
  try {
    const questionAnswer = await QuestionAnswer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!questionAnswer) {
      return res.status(404).send()
    }
    const questionAnswers = await QuestionAnswer.find().populate('chapters')
    res.status(200).send(questionAnswers)
  } catch (error) {
    res.status(400).send(error)
  }
})

// Delete a QuestionAnswer by ID
studyMaterialRoute.delete('/question-answers/:id', async (req, res) => {
  try {
    const questionAnswer = await QuestionAnswer.findByIdAndDelete(req.params.id)
    if (!questionAnswer) {
      return res.status(404).send()
    }
    res.status(200).send(questionAnswer)
  } catch (error) {
    res.status(500).send(error)
  }
})

// Page wise question answer
studyMaterialRoute.get(
  '/study-materials/:pageNumber',
  userAuth,
  async (req, res) => {
    const { pageNumber } = req.params
    const limit = 10
    const page = parseInt(pageNumber, 10)

    try {
      const skip = pageNumber * limit
      // Find the questions with pagination and sort in descending order
      const questions = await QuestionAnswer.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      // Get the total count of questions for pagination
      const totalCount = await QuestionAnswer.countDocuments()

      res.status(200).json({
        questions,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Page wise question answer based on the chapter Id
studyMaterialRoute.get(
  '/chapter/:chapterId/:pageNumber',
  userAuth,
  async (req, res) => {
    const { chapterId, pageNumber } = req.params
    const limit = 10
    const page = parseInt(pageNumber, 10)

    try {
      const skip = pageNumber * limit
      // Find the questions with the specified chapterId with pagination and sort in descending order
      const questions = await QuestionAnswer.find({ chapters: chapterId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      // Get the total count of questions with the specified chapterId for pagination
      const totalCount = await QuestionAnswer.countDocuments({
        chapters: chapterId,
      })

      res.status(200).json({
        questions,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Search question answer
studyMaterialRoute.get(
  '/search-questions/:pageNumber',
  userAuth,
  async (req, res) => {
    const query = req.query.query

    const { chapterId, pageNumber } = req.params
    const limit = 10
    const page = parseInt(pageNumber, 10)

    try {
      const skip = pageNumber * limit
      // Find the questions with the specified chapterId with pagination and sort in descending order
      const questions = await QuestionAnswer.find({
        $or: [
          { question: { $regex: query, $options: 'i' } },
          { answer: { $regex: query, $options: 'i' } },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      // Get the total count of questions with the specified chapterId for pagination
      const totalCount = await QuestionAnswer.countDocuments({
        chapters: chapterId,
      })

      res.status(200).json({
        questions,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

module.exports = studyMaterialRoute
