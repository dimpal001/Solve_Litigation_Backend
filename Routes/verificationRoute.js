const express = require('express')
const verificationRouter = express.Router()
const User = require('../Models/User')
const jwt = require('jsonwebtoken')
const svgCaptcha = require('svg-captcha')

verificationRouter.get('/generate-captcha', (req, res) => {
  const captcha = svgCaptcha.create((size = 6))
  const token = jwt.sign({ captcha: captcha.text }, process.env.SECRET_KEY, {
    expiresIn: '5m',
  })
  res.json({ captcha: captcha.data, token })
})

verificationRouter.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { email } = jwt.verify(token, process.env.SECRET_KEY)
    const user = await User.findOne({ email }).select(
      'isVerified verificationToken verificationTokenExpires'
    )
    if (!user) {
      return res.json({ message: 'Invalid token', status: 'invalid' })
    }
    if (user.isVerified) {
      return res.json({
        message: 'Email already verified',
        status: 'alreadyVerified',
      })
    }
    if (user.verificationToken !== token) {
      return res.json({ message: 'Invalid token', status: 'invalid' })
    }
    user.isVerified = true
    user.verificationToken = ''
    await user.save()
    res.status(200).json({ message: 'Email verified', status: 'verified' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

verificationRouter.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { email } = verify(token, process.env.SECRET_KEY)
    const user = await User.findOne({ email }).select('resetPasswordToken')
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' })
    }
    if (user.resetPasswordToken !== token) {
      return res.status(400).json({ message: 'Invalid token' })
    }

    user.resetPasswordToken = ''
    await user.save()
    res.status(200).json({ message: 'Token verified' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = verificationRouter
