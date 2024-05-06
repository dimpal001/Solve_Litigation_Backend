const express = require('express')
const Acts = require('../Models/Acts')
const adminAuth = require('../Middleware/adminAuth')
const staffAuth = require('../Middleware/staffAuth')
const userAuth = require('../Middleware/userAuth')

const actRoute = express.Router()

actRoute.post('/upload-act', adminAuth, async (req, res) => {
  try {
    const { institutionName, index, title, judgements, notification } =
      req.body.actData

    const newAct = new Acts({
      institutionName,
      index,
      title,
      judgements,
      notification,
      uploadedBy: {
        userId: req.user._id,
        userName: req.user.fullName,
      },
    })

    await newAct.save()

    res.status(201).json({ message: 'Act uploaded successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

actRoute.get('/pending-acts', staffAuth, async (req, res) => {
  try {
    const pendingActs = await Acts.find(
      { status: 'pending' },
      '_id status type title institutionName lastModifiedDate'
    )

    res.status(200).json({ pendingActs: pendingActs })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

actRoute.get('/approved-acts', staffAuth, async (req, res) => {
  try {
    const approvedActs = await Acts.find(
      { status: 'approved' },
      '_id status type title institutionName lastModifiedDate'
    )

    res.status(200).json({ approvedActs: approvedActs })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

actRoute.get('/get-all-acts', userAuth, async (req, res) => {
  try {
    const acts = await Acts.find(
      { status: 'approved' },
      '_id title institutionName'
    )

    res.status(200).json({ acts: acts })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = actRoute
