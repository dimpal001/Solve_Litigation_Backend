const express = require('express')
const contentsRoute = express.Router()
const Contents = require('../Models/Contents')
const Laws = require('../Models/Laws')
const Citation = require('../Models/Citation')
const Courts = require('../Models/Courts')
const User = require('../Models/User')
const adminAuth = require('../Middleware/adminAuth')

contentsRoute.get('/statistics', adminAuth, async (req, res) => {
  try {
    const noOfApprovedCitation = await Citation.countDocuments({
      status: 'approved',
    })
    const noOfPendingCitation = await Citation.countDocuments({
      status: 'pending',
    })
    const noOfGuestUser = await User.countDocuments({ userType: 'guest' })
    const noOfStaffUser = await User.countDocuments({ userType: 'staff' })

    res.status(200).json({
      noOfApprovedCitation,
      noOfPendingCitation,
      noOfGuestUser,
      noOfStaffUser,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

contentsRoute.post('/add-pol', adminAuth, async (req, res) => {
  try {
    const { name } = req.body

    const existingContent = await Contents.findOne({ name })

    if (existingContent) {
      return res.status(400).json({ message: 'Point of law already exists' })
    }

    const newContent = new Contents({
      name: name,
    })

    await newContent.save()

    res.status(201).json({ message: 'Point of law added successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.post('/add-law', adminAuth, async (req, res) => {
  try {
    const { name } = req.body

    const existingContent = await Laws.findOne({ name })

    if (existingContent) {
      return res.status(400).json({ message: 'Law already exists' })
    }

    const newContent = new Laws({
      name: name,
    })

    await newContent.save()

    res.status(201).json({ message: 'Law added successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.post('/add-courts', adminAuth, async (req, res) => {
  try {
    const { name } = req.body

    const existingContent = await Courts.findOne({ name })

    if (existingContent) {
      return res.status(400).json({ message: 'Court already exists' })
    }

    const newContent = new Courts({
      name: name,
    })

    await newContent.save()

    res.status(201).json({ message: 'Court added successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.get('/pol-list', adminAuth, async (req, res) => {
  try {
    const allPointsOfLaw = await Contents.find({}, 'name')
    res.status(200).json(allPointsOfLaw)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.get('/court-list', adminAuth, async (req, res) => {
  try {
    const allCourts = await Courts.find({}, 'name')
    res.status(200).json(allCourts)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.get('/law-list', adminAuth, async (req, res) => {
  try {
    const allLaw = await Laws.find({}, 'name')
    res.status(200).json(allLaw)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.delete('/delete-pols', adminAuth, async (req, res) => {
  try {
    const { ids } = req.body

    await Contents.deleteMany({ _id: { $in: ids } })

    res.status(200).json({ message: 'Points of law deleted successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.delete('/delete-laws', adminAuth, async (req, res) => {
  try {
    const { ids } = req.body

    await Laws.deleteMany({ _id: { $in: ids } })

    res.status(200).json({ message: 'Law deleted successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.delete('/delete-court', adminAuth, async (req, res) => {
  try {
    const { ids } = req.body

    await Courts.deleteMany({ _id: { $in: ids } })

    res.status(200).json({ message: 'Court deleted successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = contentsRoute
