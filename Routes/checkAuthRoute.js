const express = require('express')
const userAuth = require('../Middleware/userAuth')

const checkAuthRoute = express.Router()

checkAuthRoute.get('/', userAuth, async (req, res) => {
  try {
    res.status(201).json({ message: 'User authorized.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = checkAuthRoute
