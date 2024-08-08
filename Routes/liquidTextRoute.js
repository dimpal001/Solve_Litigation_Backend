const express = require('express')
const liquidTextRoute = express.Router()
const LiquidText = require('../Models/LiquidText')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const userAuth = require('../Middleware/userAuth')

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

// Route to create a client
liquidTextRoute.post('/create-client', userAuth, async (req, res) => {
  try {
    const { clientName, clientAddress, userId, userName } = req.body

    const newClient = new LiquidText({
      clientName,
      clientAddress,
      createdUser: {
        userId,
        userName,
      },
      arguments: [],
    })

    await newClient.save()

    // Fetch all clients after creating the new client
    const clients = await LiquidText.find(
      { 'createdUser.userId': userId },
      'id clientName clientAddress createdAt createdUser'
    )

    res.status(201).send({
      message: 'Client created successfully',
      clients,
    })
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// Route to add an argument to a specific client
liquidTextRoute.post(
  '/create-argument/:clientId',
  userAuth,
  upload.single('file'),
  async (req, res) => {
    try {
      const { clientId } = req.params
      const { title } = req.body

      if (!req.file) {
        return res.status(400).send({ error: 'File is required' })
      }

      const client = await LiquidText.findById(clientId)

      if (!client) {
        return res.status(404).send({ error: 'Client not found' })
      }

      const newArgument = {
        title,
        file: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
        },
        liquidText: [],
      }

      client.arguments.push(newArgument)
      await client.save()

      // Extract arguments id and title for response
      const argumentsInfo = client.arguments.map((arg) => ({
        id: arg._id,
        title: arg.title,
      }))

      res.status(201).send({
        message: 'Argument added successfully',
        arguments: argumentsInfo,
      })
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  }
)

// Route to get details of a specific argument
liquidTextRoute.get(
  '/argument-details/:clientId/:argumentId',
  async (req, res) => {
    try {
      const { clientId, argumentId } = req.params

      // Find the client and specific argument using client ID and argument ID
      const document = await LiquidText.findOne({
        _id: clientId,
        'arguments._id': argumentId,
      })

      if (!document) {
        return res
          .status(404)
          .send({ error: 'Argument not found for the client' })
      }

      // Find the specific argument within the client's arguments array
      const argument = document.arguments.find(
        (arg) => arg._id.toString() === argumentId
      )

      if (!argument) {
        return res.status(404).send({ error: 'Argument not found' })
      }

      // Send response with argument details only
      res.status(200).send({
        argumentDetails: {
          id: argument._id,
          title: argument.title,
          liquidText: argument.liquidText,
          file: {
            fileName: argument.file.fileName,
            contentType: argument.file.contentType,
            originalName: argument.file.originalName,
          },
        },
      })
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  }
)

// Download Argument/Attachment route
liquidTextRoute.get('/download-file/:filename', userAuth, async (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(__dirname, '../uploads', filename)

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Provide the file for download
    res.sendFile(filePath)
  } else {
    // File not found
    res.status(404).json({ error: 'File not found' })
  }
})

// Route to add liquid text to a specific argument
liquidTextRoute.post(
  '/add-liquid-text/:clientId/:argumentId',
  userAuth,
  async (req, res) => {
    try {
      const { clientId, argumentId } = req.params
      const { title, text, pageNo } = req.body

      const client = await LiquidText.findById(clientId)

      if (!client) {
        return res.status(404).send({ error: 'Client not found' })
      }

      const argument = client.arguments.id(argumentId)

      if (!argument) {
        return res.status(404).send({ error: 'Argument not found' })
      }

      // Create the liquid text object
      const newLiquidText = { title, text, pageNo }

      // Check if the liquid text already exists
      if (
        argument.liquidText.some(
          (lt) => lt.text === text && lt.pageNo === pageNo
        )
      ) {
        return res.status(400).send({ error: 'Liquid text already exists' })
      }

      argument.liquidText.push(newLiquidText)
      await client.save()

      // Fetch the updated client again to get the correct argument with liquidText array
      const updatedClient = await LiquidText.findById(clientId)

      if (!updatedClient) {
        return res.status(404).send({ error: 'Client not found' })
      }

      const updatedArgument = updatedClient.arguments.id(argumentId)

      if (!updatedArgument) {
        return res.status(404).send({ error: 'Argument not found' })
      }

      const allLiquidTexts = updatedArgument.liquidText

      res.status(200).send({
        message: 'Liquid text added successfully',
        liquidText: allLiquidTexts,
      })
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  }
)

// Route to fetch all clients with specific fields // done
liquidTextRoute.get('/all-clients/:userId', userAuth, async (req, res) => {
  const { userId } = req.params
  try {
    const documents = await LiquidText.find(
      { 'createdUser.userId': userId },
      'id clientName clientAddress createdAt createdUser.userName'
    )

    res.status(200).send(documents)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// Route to fetch client details and all arguments of a specific client // done
liquidTextRoute.get('/client-details/:clientId', async (req, res) => {
  try {
    const clientId = req.params.clientId

    const client = await LiquidText.findById(clientId).select(
      'clientName clientAddress arguments'
    )

    if (!client) {
      return res.status(404).send({ error: 'Client not found' })
    }

    const clientDetails = {
      clientName: client.clientName,
      clientAddress: client.clientAddress,
      arguments: client.arguments.map((arg) => ({
        id: arg._id,
        title: arg.title,
      })),
    }

    res.status(200).send(clientDetails)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// Route to delete a client
liquidTextRoute.delete(
  '/delete-client/:clientId',
  userAuth,
  async (req, res) => {
    try {
      const { clientId } = req.params

      // Find the client by ID
      const client = await LiquidText.findById(clientId)

      if (!client) {
        return res.status(404).send({ error: 'Client not found' })
      }

      // Remove associated files for all arguments
      client.arguments.forEach((argument) => {
        if (argument.file && argument.file.fileName) {
          const filePath = path.join(
            __dirname,
            '../uploads',
            argument.file.fileName
          )
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        }
      })

      // Remove the client
      await LiquidText.findByIdAndRemove(clientId)

      res.status(200).send({ message: 'Client deleted successfully' })
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  }
)

// Route to delete an argument (and its associated file) from a client
const mongoose = require('mongoose')

liquidTextRoute.delete(
  '/delete-argument/:clientId/:argumentId',
  userAuth,
  async (req, res) => {
    try {
      const { clientId, argumentId } = req.params

      // Find the client by ID
      const client = await LiquidText.findById(clientId)
      if (!client) {
        return res.status(404).send({ error: 'Client not found' })
      }

      // Find the argument by ID within the client's arguments array
      const argument = client.arguments.id(argumentId)
      if (!argument) {
        return res.status(404).send({ error: 'Argument not found' })
      }

      // Check the type of argument to ensure it's a Mongoose document instance
      console.log(
        'Argument instance check:',
        argument instanceof mongoose.Document
      )

      // Delete the associated file if it exists
      if (argument.file && argument.file.fileName) {
        const filePath = path.join(
          __dirname,
          '../uploads',
          argument.file.fileName
        )
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }

      // Alternative approach: Direct array manipulation
      client.arguments = client.arguments.filter(
        (arg) => arg._id.toString() !== argumentId
      )
      await client.save()

      res.status(200).send({ message: 'Argument deleted successfully' })
    } catch (error) {
      console.error('Error deleting argument:', error)
      res.status(500).send({ error: error.message })
    }
  }
)

// Route to delete a specific liquid text from an argument
liquidTextRoute.delete(
  '/delete-liquid-text/:clientId/:argumentId/:liquidTextId',
  userAuth,
  async (req, res) => {
    try {
      const { clientId, argumentId, liquidTextId } = req.params

      const client = await LiquidText.findById(clientId)

      if (!client) {
        return res.status(404).send({ error: 'Client not found' })
      }

      const argument = client.arguments.id(argumentId)

      if (!argument) {
        return res.status(404).send({ error: 'Argument not found' })
      }

      const liquidTextIndex = argument.liquidText.findIndex(
        (text) => text._id.toString() === liquidTextId
      )

      if (liquidTextIndex === -1) {
        return res.status(404).send({ error: 'Liquid text not found' })
      }

      // Remove the liquid text from the argument's liquidText array
      argument.liquidText.splice(liquidTextIndex, 1)
      await client.save()

      res.status(200).send({ message: 'Liquid text deleted successfully' })
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  }
)

module.exports = liquidTextRoute
