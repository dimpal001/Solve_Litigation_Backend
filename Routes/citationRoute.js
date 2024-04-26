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
    const count = await Citation.countDocuments({
      dateOfOrder: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    })
    const sequenceNo = String(count + 1).padStart(3, '0')

    let abbreviation = ''
    if (institutionName.toLowerCase().includes('supreme court')) {
      abbreviation = 'SC'
    } else if (institutionName.toLowerCase().includes('high court')) {
      abbreviation = 'HC'
    } else if (institutionName.toLowerCase().includes('tribunal')) {
      abbreviation = 'TR'
    }

    const citationNo = `${year}-SL-${abbreviation}-${sequenceNo}`

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

    res.status(201).json({ message: 'Citation uploaded successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.put('/update-citation/:id', staffAuth, async (req, res) => {
  try {
    const citationId = req.params.id
    const updatedCitationData = req.body.citationData

    const isNormalCitation = await Citation.exists({ _id: citationId })

    if (isNormalCitation) {
      if ('institutionName' in updatedCitationData) {
        const abbreviation = getAbbreviation(
          updatedCitationData.institutionName
        )
        if (!abbreviation) {
          return res.status(400).json({ error: 'Invalid institutionName' })
        }
        updatedCitationData.citationNo = await generateCitationNo(abbreviation)
      }

      updatedCitationData.status = 'pending'
      updatedCitationData.lastModifiedDate = new Date()

      const updatedCitation = await Citation.findByIdAndUpdate(
        citationId,
        updatedCitationData,
        { new: true }
      )

      if (!updatedCitation) {
        return res.status(404).json({ error: 'Citation not found' })
      }

      return res.status(200).json({ message: 'Citation updated successfully' })
    }

    const isActCitation = await Act.exists({ _id: citationId })

    if (isActCitation) {
      if ('institutionName' in updatedCitationData) {
        const abbreviation = getAbbreviation(
          updatedCitationData.institutionName
        )
        if (!abbreviation) {
          return res.status(400).json({ error: 'Invalid institutionName' })
        }
        updatedCitationData.citationNo = await generateCitationNo(abbreviation)
      }

      updatedCitationData.status = 'pending'
      updatedCitationData.lastModifiedDate = new Date()

      const updatedAct = await Act.findByIdAndUpdate(
        citationId,
        updatedCitationData,
        { new: true }
      )

      if (!updatedAct) {
        return res.status(404).json({ error: 'Act not found' })
      }

      return res.status(200).json({ message: 'Act updated successfully' })
    }

    return res.status(404).json({ error: 'Citation or Act not found' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

async function generateCitationNo(abbreviation) {
  const year = new Date().getFullYear()
  const count = await Citation.countDocuments({
    dateOfOrder: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    },
  })
  const sequenceNo = String(count + 1).padStart(3, '0')
  return `${year}-SL-${abbreviation}-${sequenceNo}`
}

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

citationRoute.delete('/delete-citation/:id', staffAuth, async (req, res) => {
  try {
    const citationId = req.params.id

    const citation = await Citation.findById(citationId)
    if (citation) {
      await Citation.findByIdAndDelete(citationId)
      return res.status(200).json({ message: 'Citation deleted successfully' })
    }

    const act = await Act.findById(citationId)
    if (act) {
      await Act.findByIdAndDelete(citationId)
      return res
        .status(200)
        .json({ message: 'Act citation deleted successfully' })
    }

    return res.status(404).json({ error: 'Citation not found' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/pending-citations', staffAuth, async (req, res) => {
  try {
    const pendingCitations = await Citation.find(
      { status: 'pending' },
      '_id status type citationNo title dateOfOrder institutionName lastModifiedDate'
    )

    const pendingActs = await Act.find(
      { status: 'pending' },
      '_id status institutionName type title citationNo'
    )

    const allPendingCitations = [...pendingCitations, ...pendingActs]

    const truncatedCitations = allPendingCitations.map((citation) => {
      if (citation.judgments && citation.judgments.length > 150) {
        citation.judgments = citation.judgments.substring(0, 150)
      }
      return citation
    })

    res.status(200).json({ pendingCitations: truncatedCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/approved-citations', staffAuth, async (req, res) => {
  try {
    const citations = await Citation.find(
      { status: 'approved' },
      '_id status type citationNo title dateOfOrder institutionName lastModifiedDate'
    )

    const acts = await Act.find(
      { status: 'approved' },
      '_id status type title citationNo'
    )

    const approvedCitations = [...citations, ...acts]

    const truncatedCitations = approvedCitations.map((citation) => {
      if (citation.judgments && citation.judgments.length > 150) {
        citation.judgments = citation.judgments.substring(0, 150)
      }
      return citation
    })

    res.status(200).json({ approvedCitations: truncatedCitations })
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
      '_id status type citationNo title laws dateOfOrder institutionName lastModifiedDate'
    )

    const truncatedCitations = filteredCitations.map((citation) => {
      if (citation.judgments && citation.judgments.length > 150) {
        citation.judgments = citation.judgments.substring(0, 150)
      }
      return citation
    })

    res.status(200).json({ citations: truncatedCitations })
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
      .select('_id title dateOfOrder laws institutionName headNote createdAt')

    const truncatedCitations = last10Citations.map((citation) => {
      if (citation.headNote) {
        // Convert HTML to plain text
        const plainTextHeadNote = citation.headNote
          .replace(/<\/?[^>]+(>|$)/g, '')
          .replace(/&nbsp;/g, ' ')
        citation.headNote = plainTextHeadNote.substring(0, 200)
        if (plainTextHeadNote.length > 200) {
          citation.headNote += '...'
        }
      }
      return citation
    })

    res.status(200).json({ last10Citations: truncatedCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = citationRoute
