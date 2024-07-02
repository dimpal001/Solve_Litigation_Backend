const express = require('express')
const contentsRoute = express.Router()
const Contents = require('../Models/Contents')
const Laws = require('../Models/Laws')
const Citation = require('../Models/Citation')
const Act = require('../Models/Acts')
const Courts = require('../Models/Courts')
const User = require('../Models/User')
const ApellateType = require('../Models/ApellateType')
const adminAuth = require('../Middleware/adminAuth')
const staffAuth = require('../Middleware/staffAuth')
const userAuth = require('../Middleware/userAuth')

contentsRoute.get('/statistics', staffAuth, async (req, res) => {
  try {
    const approvedCitations = await Citation.countDocuments({
      status: 'approved',
    })
    const pendingCitations = await Citation.countDocuments({
      status: 'pending',
    })

    const approvedActs = await Act.countDocuments({ status: 'approved' })
    const pendingActs = await Act.countDocuments({ status: 'pending' })

    const noOfApprovedCitation = approvedCitations + approvedActs
    const noOfPendingCitation = pendingCitations + pendingActs

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

contentsRoute.put('/update-law', adminAuth, async (req, res) => {
  try {
    const { _id, newName } = req.body

    // Check if the _id is valid
    if (!_id) {
      return res.status(400).json({ message: 'Law _id is required' })
    }

    // Check if the newName is provided
    if (!newName) {
      return res.status(400).json({ message: 'New law name is required' })
    }

    // Check if the new name already exists in Laws collection
    const existingLaw = await Laws.findOne({ name: newName })
    if (existingLaw) {
      return res
        .status(400)
        .json({ message: 'Law with this name already exists' })
    }

    // Find the law by _id and update its name
    const updatedLaw = await Laws.findByIdAndUpdate(
      _id,
      { name: newName },
      { new: true } // to return the updated document
    )

    if (!updatedLaw) {
      return res.status(404).json({ message: 'Law not found' })
    }

    res.status(200).json({ message: 'Law updated successfully', updatedLaw })
  } catch (error) {
    console.error(error)
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

contentsRoute.post('/add-apellate', adminAuth, async (req, res) => {
  try {
    const { name } = req.body

    const existingContent = await ApellateType.findOne({ name })

    if (existingContent) {
      return res.status(400).json({ message: 'Apellate Type already exists' })
    }

    const newContent = new ApellateType({
      name: name,
    })

    await newContent.save()

    res.status(201).json({ message: 'Apellate Type added successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.get('/pol-list', staffAuth, async (req, res) => {
  try {
    const allPointsOfLaw = await Contents.find({}, 'name')
    res.status(200).json(allPointsOfLaw)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.get('/court-list', staffAuth, async (req, res) => {
  try {
    const allCourts = await Courts.find({}, 'name')
    res.status(200).json(allCourts)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.get('/law-list', staffAuth, async (req, res) => {
  try {
    const allLaw = await Laws.find({}, 'name')
    res.status(200).json(allLaw)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

contentsRoute.get('/apellate-list', userAuth, async (req, res) => {
  try {
    const allApellateTypes = await ApellateType.find({}, 'name')
    res.status(200).json(allApellateTypes)
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

contentsRoute.delete('/delete-apellate', adminAuth, async (req, res) => {
  try {
    const { ids } = req.body

    await ApellateType.deleteMany({ _id: { $in: ids } })

    res.status(200).json({ message: 'Apellate type deleted successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = contentsRoute
