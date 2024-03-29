const express = require('express')
const Citation = require('../Models/Citation')
const adminAuth = require('../Middleware/adminAuth')
const userAuth = require('../Middleware/userAuth')

const citationRoute = express.Router()

citationRoute.post('/upload-citation', adminAuth, async (req, res) => {
  try {
    const {
      institutionName,
      apellateType,
      caseNo,
      partyNameAppealant,
      partyNameRespondent,
      title,
      judgments,
      dateOfOrder,
      judgeName,
      headNote,
      referedJudgements,
      laws,
      pointOfLaw,
      equivalentCitations,
      advocatePetitioner,
      advocateRespondent,
      reportable,
      overRuled,
    } = req.body.citationData

    // Generate citation number
    const year = new Date(dateOfOrder).getFullYear()
    console.log(year)
    console.log(dateOfOrder)
    const count = await Citation.countDocuments({
      dateOfOrder: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    })
    const sequenceNo = String(count + 1).padStart(3, '0')
    const citationNo = `${year}-SL-${sequenceNo}`

    const newCitation = new Citation({
      institutionName,
      apellateType,
      caseNo,
      partyNameAppealant,
      partyNameRespondent,
      title,
      judgments,
      dateOfOrder,
      judgeName,
      headNote,
      referedJudgements,
      laws,
      pointOfLaw,
      equivalentCitations,
      advocatePetitioner,
      advocateRespondent,
      reportable,
      overRuled,
      citationNo,
      uploadedBy: {
        userId: req.user._id,
        userName: req.user.fullName,
      },
    })

    const savedCitation = await newCitation.save()

    // Send success message
    res.status(201).json({ message: 'Citation uploaded successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/pending-citations', adminAuth, async (req, res) => {
  try {
    const pendingCitations = await Citation.find(
      { status: 'pending' },
      '_id status title citationNo'
    )

    res.status(200).json({ pendingCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/approved-citations', adminAuth, async (req, res) => {
  try {
    const approvedCitations = await Citation.find(
      { status: 'approved' },
      '_id status title citationNo'
    )

    res.status(200).json({ approvedCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/citation/:id', userAuth, async (req, res) => {
  try {
    const citation = await Citation.findById(req.params.id)
    if (!citation) {
      return res.status(404).json({ error: 'Citation not found' })
    }
    res.status(200).json({ citation })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.put('/approve-citation/:id', adminAuth, async (req, res) => {
  try {
    const citation = await Citation.findById(req.params.id)
    if (!citation) {
      res.status(404).json({ error: 'Citation not found' })
    }
    citation.status = 'approved'
    await citation.save()
    res.status(200).json({ message: 'Citation approved successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/get-laws-by-apellateType', async (req, res) => {
  try {
    const { apellateType } = req.body

    const matchingLaws = await Citation.distinct('laws', {
      apellateType: apellateType,
    })

    res.status(200).json({ laws: matchingLaws })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/get-pointOfLaw-by-law', async (req, res) => {
  try {
    const { apellateType, law } = req.body

    const matchingPointOfLaw = await Citation.distinct('pointOfLaw', {
      apellateType: apellateType,
      laws: law,
    })

    res.status(200).json({ pointOfLaw: matchingPointOfLaw })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/get-citations-by-filter', async (req, res) => {
  try {
    const { apellateType, law, pointOfLaw } = req.body

    const filteredCitations = await Citation.find(
      {
        apellateType: apellateType,
        laws: law,
        pointOfLaw: pointOfLaw,
      },
      '_id citationNo title'
    )

    res.status(200).json({ citations: filteredCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = citationRoute
