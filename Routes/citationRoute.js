const express = require('express')
const Citation = require('../Models/Citation')
const Act = require('../Models/Acts')
const adminAuth = require('../Middleware/adminAuth')
const staffAuth = require('../Middleware/staffAuth')
const userAuth = require('../Middleware/userAuth')
const { default: puppeteer } = require('puppeteer')
const { shareCitationLink } = require('../utils/registrationVerificationMail')

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
      title1,
      title2,
      judgements,
      diaryNo,
      dateOfOrder,
      dateOfHearing,
      judgeName,
      headNote,
      referedJudgements,
      laws,
      pointOfLaw,
      equivalentCitations,
      whetherReported,
      advocatePetitioner,
      advocateRespondent,
      reportable,
      overRuled,
    } = req.body.citationData

    // Check if caseNo already exists
    const existingCitation = await Citation.findOne({ caseNo })
    if (existingCitation) {
      return res.status(400).json({ error: 'Citation already exists' })
    }
    const abbreviation = getAbbreviation(institutionName)
    const courtAbbreviation = getCourtAbbreviation(institutionName)

    // Ensure valid abbreviation
    if (!abbreviation) {
      return res.status(400).json({ error: 'Invalid institutionName' })
    }

    const newAbbreviation = !institutionName
      .toLowerCase()
      .includes('supreme court')
      ? `${abbreviation}-${courtAbbreviation}`
      : abbreviation

    console.log(newAbbreviation)

    // Generate unique citation number
    const citationNo = await generateCitationNo(newAbbreviation, dateOfOrder)

    // Construct new Citation object
    const newCitation = new Citation({
      institutionName,
      index,
      apellates,
      caseNo,
      partyNameAppealant,
      partyNameRespondent,
      title,
      title1,
      title2,
      judgements,
      diaryNo,
      dateOfOrder,
      dateOfHearing,
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
      whetherReported,
      uploadedBy: {
        userId: req.user._id,
        userName: req.user.fullName,
      },
    })

    // Save the new citation
    const savedCitation = await newCitation.save()

    res.status(201).json({ message: 'Citation uploaded successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

function getCourtAbbreviation(court) {
  if (court.toLowerCase().includes('high court')) {
    // If 'high court' is in the name, get the first three letters of the relevant court name part
    const parts = court.split(' ')
    for (let i = 0; i < parts.length; i++) {
      if (
        parts[i].toLowerCase() !== 'high' &&
        parts[i].toLowerCase() !== 'court' &&
        parts[i].toLowerCase() !== 'the' &&
        parts[i].toLowerCase() !== 'of'
      ) {
        return parts[i].substring(0, 3).toLowerCase()
      }
    }
  } else if (court.toLowerCase().includes('tribunal')) {
    // If 'tribunal' is in the name, return 'tri'
    return 'TRI'
  } else {
    // For other cases, return the first three letters of the first relevant word
    const parts = court.split(' ')
    for (let i = 0; i < parts.length; i++) {
      if (
        parts[i].toLowerCase() !== 'the' &&
        parts[i].toLowerCase() !== 'of' &&
        parts[i].toLowerCase() !== '&'
      ) {
        return parts[i].substring(0, 3).toLowerCase()
      }
    }
  }
  return ''
}

citationRoute.put('/update-citation/:id', staffAuth, async (req, res) => {
  try {
    const citationId = req.params.id
    const updatedCitationData = req.body.citationData

    const isNormalCitation = await Citation.exists({ _id: citationId })

    if (isNormalCitation) {
      const citation = await Citation.findById(citationId)
      let newCitationNo = ''
      if (updatedCitationData.dateOfOrder) {
        newCitationNo = updateCitationNo(
          citation.citationNo,
          updatedCitationData.dateOfOrder
        )
        updatedCitationData.citationNo = newCitationNo
      }

      if (updatedCitationData.institutionName !== citation.institutionName) {
        let abbreviation = getAbbreviation(updatedCitationData.institutionName)
        const courtAbbreviation = getCourtAbbreviation(
          updatedCitationData.institutionName
        )

        const newAbbreviation = !updatedCitationData.institutionName
          .toLowerCase()
          .includes('supreme court')
          ? `${abbreviation}-${courtAbbreviation}`
          : abbreviation

        console.log(newAbbreviation)

        if (!abbreviation) {
          return res.status(400).json({ error: 'Invalid institutionName' })
        }
        updatedCitationData.citationNo = await generateCitationNo(
          newAbbreviation,
          updatedCitationData.dateOfOrder
        )
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

const updateCitationNo = (citationNo, dateOfOrder) => {
  // Extract the year from dateOfOrder
  const newYear = String(new Date(dateOfOrder).getFullYear())

  // Replace the first 4 characters of citationNo with the new year
  const updatedCitationNo = newYear + citationNo.slice(4)

  return updatedCitationNo
}

const generateCitationNo = async (abbreviation, dateOfOrder) => {
  let sequenceNo = 1
  let citationNo = ''
  const year = String(new Date(dateOfOrder).getFullYear())

  while (true) {
    citationNo = `${year}-SL-${abbreviation}-${String(sequenceNo).padStart(
      3,
      '0'
    )}`

    // Check if the generated citation number already exists in the database
    const existingCitation = await Citation.findOne({
      citationNo: citationNo,
    })

    // If the citation number exists, increment the sequence number
    if (existingCitation) {
      sequenceNo++
    } else {
      // If the citation number is unique, break the loop
      break
    }
  }

  return citationNo
}

const getAbbreviation = (institutionName) => {
  if (institutionName.toLowerCase().includes('supreme court')) {
    return 'SC'
  } else if (institutionName.toLowerCase().includes('high court')) {
    return 'HC'
  } else if (institutionName.toLowerCase().includes('tribunal')) {
    return 'TR'
  }
  return null
}

citationRoute.delete('/delete-citation/:id', adminAuth, async (req, res) => {
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
      '_id status type citationNo title createdAt dateOfOrder institutionName lastModifiedDate'
    )

    res.status(200).json({ pendingCitations: pendingCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/approved-citations', adminAuth, async (req, res) => {
  try {
    const citations = await Citation.find(
      { status: 'approved' },
      '_id status type citationNo title createdAt dateOfOrder institutionName lastModifiedDate'
    )

    res.status(200).json({ approvedCitations: citations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/citation/:id', async (req, res) => {
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

    const apellateTypes = Array.isArray(apellateType)
      ? apellateType
      : [apellateType]

    const matchingLaws = await Citation.distinct('laws', {
      apellates: { $in: apellateTypes },
      status: 'approved',
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
      status: 'approved',
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
        status: 'approved',
      },
      '_id status type citationNo title laws dateOfOrder institutionName lastModifiedDate headNote'
    )

    const truncatedCitations = filteredCitations.map((citation) => {
      if (citation.headNote) {
        const plainTextHeadNote = citation.headNote
          .replace(/<\/?[^>]+(>|$)/g, '')
          .replace(/&nbsp;/g, ' ')
        citation.headNote = plainTextHeadNote
      }
      return citation
    })

    res.status(200).json({ citations: truncatedCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.post('/citation-pdf', userAuth, async (req, res) => {
  const { htmlContent } = req.body
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.setContent(htmlContent)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm',
      },
      printBackground: true,
    })
    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf')
    res.send(pdfBuffer)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get(
  '/last-10-citations/:pageNumber',
  userAuth,
  async (req, res) => {
    const { pageNumber } = req.params
    const limit = 10 // Set the limit to 10 citations per page

    try {
      // Calculate skip based on page number and limit
      const skip = pageNumber * limit

      // Fetch total count of approved citations
      const totalApprovedCitations = await Citation.countDocuments({
        status: 'approved',
      })

      // Calculate total pages based on total count and limit
      const totalPages = Math.ceil(totalApprovedCitations / limit)

      const last10ApprovedCitations = await Citation.find({
        status: 'approved',
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id title dateOfOrder laws institutionName headNote createdAt')

      const truncatedCitations = last10ApprovedCitations.map((citation) => {
        if (citation.headNote) {
          const plainTextHeadNote = citation.headNote
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/&nbsp;/g, ' ')
          citation.headNote = plainTextHeadNote
        }
        return citation
      })

      res.status(200).json({
        last10Citations: truncatedCitations,
        currentPage: parseInt(pageNumber, 10),
        totalPages,
        totalApprovedCitations,
        limit,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

citationRoute.post('/share', userAuth, async (req, res) => {
  try {
    const link = req.body.link
    const email = req.body.email
    const name = req.user.fullName

    await shareCitationLink(email, link, name)

    res.status(200).json({ message: 'Judgement has been shared' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get('/search-citations', userAuth, async (req, res) => {
  try {
    const query = req.query.query

    const citations = await Citation.find({
      $or: [
        { judgements: { $regex: query, $options: 'i' } },
        { laws: { $regex: query, $options: 'i' } },
        { pointOfLaw: { $regex: query, $options: 'i' } },
        { equivalentCitations: { $regex: query, $options: 'i' } },
        { headNote: { $regex: query, $options: 'i' } },
        { judgements: { $regex: query, $options: 'i' } },
      ],
    })
      .select('_id title dateOfOrder laws institutionName headNote createdAt') // Select desired fields
      .limit(10) // Limit the number of results to 10

    // Transform each citation to format the headNote as plain text
    const transformedCitations = citations.map((citation) => {
      if (citation.headNote) {
        const plainTextHeadNote = citation.headNote
          .replace(/<\/?[^>]+(>|$)/g, '')
          .replace(/&nbsp;/g, ' ')
        citation.headNote = plainTextHeadNote
      }
      return citation
    })

    res.status(200).json({ matchedCitations: transformedCitations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

citationRoute.get(
  '/search-by-date/:year/:month/:day',
  userAuth,
  async (req, res) => {
    try {
      const { year, month, day } = req.params

      // Create start date from year, month, and day parameters in UTC
      const startDate = new Date(Date.UTC(year, month - 1, day))
      startDate.setUTCHours(0, 0, 0, 0)

      // Create end date (start of the next day) in UTC
      const endDate = new Date(startDate)
      endDate.setUTCDate(startDate.getUTCDate() + 1)

      const matchedCitations = await Citation.find(
        {
          dateOfOrder: {
            $gte: startDate,
            $lt: endDate,
          },
        },
        '_id status type citationNo createdAt title dateOfOrder institutionName lastModifiedDate'
      )

      res.status(200).json(matchedCitations)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

module.exports = citationRoute
