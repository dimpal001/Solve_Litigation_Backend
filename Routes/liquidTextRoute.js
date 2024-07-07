const express = require('express')
const liquidTextRoute = express.Router()
const LiquidText = require('../Models/LiquidText')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Set the destination for file uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const fileExtension = path.extname(file.originalname)
    const newFileName = uniqueSuffix + fileExtension
    cb(null, newFileName)
  },
})

const upload = multer({ storage: storage })

// Route to upload a file and add liquid text
liquidTextRoute.post(
  '/upload-file',
  upload.single('file'),
  async (req, res) => {
    try {
      const { title, userId, userName } = req.body

      if (!req.file) {
        return res.status(400).send({ error: 'File is required' })
      }

      const newLiquidText = new LiquidText({
        title,
        userDetails: {
          userId,
          userName,
        },
        file: {
          fileName: req.file.filename, // Store only the file name
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
        },
        liquidText: [], // Assuming liquidText is sent as a comma-separated string
      })

      await newLiquidText.save()

      res.status(201).send({
        message: 'Liquid text and file uploaded successfully',
        data: newLiquidText,
      })
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  }
)

// Route to add liquid text to an existing document
liquidTextRoute.post('/add-text/:id', async (req, res) => {
  try {
    const { liquidText } = req.body
    const liquidTextId = req.params.id

    const document = await LiquidText.findById(liquidTextId)

    if (!document) {
      return res.status(404).send({ error: 'Document not found' })
    }

    document.liquidText.push(liquidText)
    await document.save()

    res
      .status(200)
      .send({ message: 'Liquid text added successfully', data: document })
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// Route to fetch all documents with specific fields
liquidTextRoute.get('/all-documents', async (req, res) => {
  try {
    const documents = await LiquidText.find({}, 'id title createdAt')

    res.status(200).send(documents)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// Route to fetch details of a specific document by ID
liquidTextRoute.get('/document-details/:id', async (req, res) => {
  try {
    const documentId = req.params.id

    const document = await LiquidText.findById(documentId)

    if (!document) {
      return res.status(404).send({ error: 'Document not found' })
    }

    // Read the file if it's stored locally
    const filePath = path.join(
      __dirname,
      '..',
      'uploads',
      document.file.fileName
    )
    const fileBuffer = fs.readFileSync(filePath)

    // Set the appropriate content type based on the file type (PDF, Word, etc.)
    let contentType = 'application/pdf'
    if (document.file.contentType === 'application/msword') {
      contentType = 'application/msword'
    } else if (
      document.file.contentType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      contentType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    // Set headers for file download
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${document.file.originalName}"`,
    })

    // Send the document details and file content
    res.status(200).send({
      document,
      file: fileBuffer,
    })
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

module.exports = liquidTextRoute
