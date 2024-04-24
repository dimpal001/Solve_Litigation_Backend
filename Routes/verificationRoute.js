// Routes to handle verification of user email and password reset

const express = require('express')
const verificationRouter = express.Router()
const User = require('../Models/User')
const { verify } = require('jsonwebtoken')

verificationRouter.post('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params
        const { email } = verify(token, process.env.SECRET_KEY)
        const user = await User
            .findOne({ email })
            .select('isVerified verificationToken verificationTokenExpires')
        if (!user) {
            return res.status(400).json({ message: 'Invalid token' })
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' })
        }
        if (user.verificationToken !== token) {
            return res.status(400).json({ message: 'Invalid token' })
        }
        user.isVerified = true
        user.verificationToken = ''
        await user.save()
        res.json({ message: 'Email verified' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

verificationRouter.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params
        const { email } = verify(token, process.env.SECRET_KEY)
        const user = await User
            .findOne({ email })
            .select('resetPasswordToken')
        if (!user) {
            return res.status(400).json({ message: 'Invalid token' })
        }
        if (user.resetPasswordToken !== token) {
            return res.status(400).json({ message: 'Invalid token' })
        }

        user.resetPasswordToken = ''
        await user.save()
        res.json({ message: 'Token verified' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
)

module.exports = verificationRouter