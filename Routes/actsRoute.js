const express = require('express')
const Acts = require('../Models/Acts')
const adminAuth = require('../Middleware/adminAuth')

const actRoute = express.Router()

actRoute.post('/upload-act', adminAuth, async (req, res) => {
  try {
    const { institutionName, index, title, judgments, notification } =
      req.body.actData

    const currentYear = new Date().getFullYear()

    const abbreviation = getAbbreviation(institutionName)
    if (!abbreviation) {
      return res.status(400).json({ error: 'Invalid institutionName' })
    }

    const count = await Acts.countDocuments({
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lt: new Date(`${currentYear + 1}-01-01`),
      },
    })

    const serialNumber = String(count + 1).padStart(3, '0')

    const citationNo = `${currentYear}-SL-${abbreviation}-${serialNumber}`

    const newAct = new Acts({
      institutionName,
      index,
      title,
      judgments,
      citationNo,
      notification,
      uploadedBy: {
        userId: req.user._id,
        userName: req.user.fullName,
      },
    })

    const savedAct = await newAct.save()

    res.status(201).json({ message: 'Act uploaded successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

function getAbbreviation(institutionName) {
  if (institutionName.toLowerCase().includes('supreme court')) {
    return 'SC'
  } else if (institutionName.toLowerCase().includes('high court')) {
    return 'HC'
  } else if (institutionName.toLowerCase().includes('tribunal')) {
    return 'TR'
  }
  return null
}

module.exports = actRoute
