const express = require('express')
const bcrypt = require('bcrypt')
const config = require('../Middleware/config')
const jwt = require('jsonwebtoken')
const legalAdviceRoute = express.Router()
const User = require('../Models/User')
const adminAuth = require('../Middleware/adminAuth')
const {
  sendVerificationEmail,
} = require('../utils/registrationVerificationMail')

legalAdviceRoute.post('/create-lawyer', adminAuth, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      registrationType,
      state,
      specialist,
      district,
    } = req.body

    const isEmailExist = await User.findOne({ email })

    if (isEmailExist && isEmailExist.isVerified === true) {
      return res.status(401).json({ error: 'Email is already registered' })
    }

    const isMobileExist = await User.findOne({ phoneNumber })

    if (isMobileExist && isMobileExist.isVerified === true) {
      return res
        .status(401)
        .json({ error: 'Mobile number is already registered' })
    }

    if (isEmailExist && isEmailExist.isVerified === false) {
      await User.findByIdAndDelete(isEmailExist._id)
    }

    if (isMobileExist && isMobileExist.isVerified === false) {
      await User.findByIdAndDelete(isMobileExist._id)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const token = jwt.sign({ email }, config.SECRET_KEY, { expiresIn: '2h' })

    const user = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      registrationType,
      state,
      specialist,
      district,
      userType: 'lawyer',
      verificationToken: token,
    })

    await user.save()

    await sendVerificationEmail(email, token, user.fullName)

    res.status(201).json({ message: 'Lawyer registered successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

legalAdviceRoute.get('/lawyer-list', adminAuth, async (req, res) => {
  try {
    const allLawyer = await User.find({ userType: 'lawyer' })

    res.status(200).json(allLawyer)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

legalAdviceRoute.get('/lawyer/:id', adminAuth, async (req, res) => {
  try {
    const lawyer = await User.findOne(
      { _id: req.params.id, userType: 'lawyer' },
      'fullName email phoneNumber bio specialist state district address'
    )

    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' })
    }

    res.status(200).json({ lawyer })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = legalAdviceRoute
