// route to handle all legal advice requests

const express = require('express')
const legalAdviceRequestRouter = express.Router()
const LegalAdviceRequest = require('../Models/LegalAdviceRequest')
const multer = require('multer')
const userAuth = require('../Middleware/userAuth')
const adminAuthMiddleware = require('../Middleware/adminAuth')

const storage = multer.memoryStorage()
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
})

legalAdviceRequestRouter.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const requests = await LegalAdviceRequest.find({}).populate('user')

    // Map over each request to limit the length of caseDetails and exclude attachment
    const limitedRequests = requests.map((request) => {
      // Check if caseDetails exists and is a string before truncating
      const limitedCaseDetails =
        typeof request.caseDetails === 'string'
          ? request.caseDetails.substring(0, 20)
          : request.caseDetails

      // Create a shallow copy of the request object and exclude attachment
      const filteredRequest = { ...request.toObject() }
      delete filteredRequest.attachment

      return {
        ...filteredRequest,
        caseDetails: limitedCaseDetails,
      }
    })

    res.status(200).json({ requests: limitedRequests })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// get a single legal advice request
legalAdviceRequestRouter.get('/:id', async (req, res) => {
  try {
    const request = await LegalAdviceRequest.findById(req.params.id).populate()
    res.status(200).json(request)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete a request
legalAdviceRequestRouter.delete('/:id', async (req, res) => {
  try {
    const request = await LegalAdviceRequest.findByIdAndDelete(req.params.id)
    res.status(200).json(request)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

legalAdviceRequestRouter.get('/case-details/:id', async (req, res) => {
  try {
    const request = await LegalAdviceRequest.findById(req.params.id).select(
      'caseDetails'
    )
    res.status(200).json(request)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// get attachments for a legal advice request
legalAdviceRequestRouter.get('/:id/attachments', userAuth, async (req, res) => {
  try {
    const request = await LegalAdviceRequest.findById(req.params.id)
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }
    if (!request.attachment) {
      return res.status(404).json({ message: 'Attachment not found' })
    }
    res.send(request.attachment.data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// create a legal advice request
legalAdviceRequestRouter.post(
  '/',
  userAuth,
  upload.single('attachment'),
  async (req, res) => {
    const { caseDetails } = req.body
    const attachment = {
      data: req.file ? req.file.buffer : null,
      contentType: req.file ? req.file.mimetype : null,
    }

    try {
      if (!caseDetails) {
        return res.status(400).json({ message: 'Case details are required' })
      }

      const request = new LegalAdviceRequest({
        caseDetails: req.body.caseDetails,
        attachment: attachment,
        user: req.user._id,
        isAttachment: !!req.file,
      })
      const newRequest = await request.save()
      res.status(201).json(newRequest)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }
)

// My requests
legalAdviceRequestRouter.get(
  '/my-requests/:userId',
  userAuth,
  async (req, res) => {
    try {
      const requests = await LegalAdviceRequest.find(
        { user: req.params.userId },
        {
          _id: 1,
          isAttachment: 1,
          isFeedback: 1,
          feedback: 1,
          createdAt: 1,
          user: 1,
        }
      )

      if (requests.length === 0) {
        return res
          .status(404)
          .json({ message: 'No previous requests found for this user!' })
      }

      res.status(200).json(requests)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }
)

legalAdviceRequestRouter.post(
  '/give-feedback/:id',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const requestId = req.params.id
      const { feedback } = req.body

      const updatedRequest = await LegalAdviceRequest.findByIdAndUpdate(
        requestId,
        {
          feedback: feedback,
          isFeedback: true,
        }
      )

      if (!updatedRequest) {
        return res.status(404).json({ error: 'Request not found' })
      }

      res.status(200).json({ message: 'Feedback submitted successfully' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

module.exports = legalAdviceRequestRouter
