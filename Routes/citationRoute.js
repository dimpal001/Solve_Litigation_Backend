const express = require('express')
const Citation = require('../Models/Citation')
const Act = require('../Models/Acts')
const adminAuth = require('../Middleware/adminAuth')
const staffAuth = require('../Middleware/staffAuth')
const userAuth = require('../Middleware/userAuth')
const { default: puppeteer } = require('puppeteer')

const citationRoute = express.Router()

citationRoute.post('/upload-citation', staffAuth, async (req, res) => {
  try {
    const {
      institutionName,
      index,
      apellates,
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
      index,
      apellates,
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

citationRoute.get('/pending-citations', staffAuth, async (req, res) => {
  try {
    const pendingCitations = await Citation.find(
      { status: 'pending' },
      '_id status type title citationNo'
    )

    const pendingActs = await Act.find(
      { status: 'pending' },
      '_id status type title citationNo'
    )

    const allPendingCitations = [...pendingCitations, ...pendingActs]

    res.status(200).json({ pendingCitations: allPendingCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/approved-citations', staffAuth, async (req, res) => {
  try {
    const citations = await Citation.find(
      { status: 'approved' },
      '_id status type title citationNo'
    )

    const acts = await Act.find(
      { status: 'approved' },
      '_id status type title citationNo'
    )

    const approvedCitations = [...citations, ...acts]

    res.status(200).json({ approvedCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/citation/:id', userAuth, async (req, res) => {
  try {
    let citation = await Citation.findById(req.params.id)

    if (!citation) {
      citation = await Act.findById(req.params.id)
    }

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
    const act = await Act.findById(req.params.id)
    if (!citation && !act) {
      res.status(404).json({ error: 'Citation not found' })
    }

    if (citation) {
      citation.status = 'approved'
      await citation.save()
      res.status(200).json({ message: 'Citation approved successfully' })
    } else {
      act.status = 'approved'
      await act.save()
      res.status(200).json({ message: 'Act approved successfully' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/get-laws-by-apellateType', userAuth, async (req, res) => {
  try {
    const { apellateType } = req.body

    // Convert apellateType to an array if it's not already
    const apellateTypes = Array.isArray(apellateType)
      ? apellateType
      : [apellateType]

    const matchingLaws = await Citation.distinct('laws', {
      apellates: { $in: apellateTypes },
    })

    res.status(200).json({ laws: matchingLaws })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/get-pointOfLaw-by-law', userAuth, async (req, res) => {
  try {
    const { apellateType, law } = req.body

    const matchingPointOfLaw = await Citation.distinct('pointOfLaw', {
      apellates: apellateType,
      laws: law,
    })

    res.status(200).json({ pointOfLaw: matchingPointOfLaw })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/get-citations-by-filter', userAuth, async (req, res) => {
  try {
    const { apellateType, law, pointOfLaw } = req.body

    const filteredCitations = await Citation.find(
      {
        apellates: apellateType,
        laws: law,
        pointOfLaw: pointOfLaw,
      },
      '_id citationNo title institutionName'
    )

    res.status(200).json({ citations: filteredCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/citation-pdf', async (req, res) => {
  const { htmlContent } = req.body
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(htmlContent)
    const pdfBuffer = await page.pdf({ format: 'A4' })
    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf')
    res.send(pdfBuffer)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/last-10-citations', userAuth, async (req, res) => {
  try {
    const last10Citations = await Citation.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id title citationNo createdAt')

    res.status(200).json({ last10Citations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = citationRoute
