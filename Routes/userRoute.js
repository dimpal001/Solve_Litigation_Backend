const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../Middleware/config')
const userRoute = express.Router()
const User = require('../Models/User')
const userAuth = require('../Middleware/userAuth')

userRoute.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      registrationType,
      state,
      district,
    } = req.body

    const isEmailExist = await User.findOne({ email })

    if (isEmailExist) {
      return res.status(401).json({ message: 'Email is already registered' })
    }

    const isMobileExist = await User.findOne({ phoneNumber })

    if (isMobileExist) {
      return res
        .status(401)
        .json({ message: 'Mobile number is already registered' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      fullName,
      email,
      phoneNumber,
      registrationType,
      state,
      district,
      password: hashedPassword,
      userType: 'guest',
    })

    await user.save()

    res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.post('/login', async (req, res) => {
  try {
    const { emailOrPhoneNumber, password } = req.body

    // Check if either email or phoneNumber is provided
    const user = await User.findOne({
      $or: [{ email: emailOrPhoneNumber }, { phoneNumber: emailOrPhoneNumber }],
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // If the password is valid, generate a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.SECRET_KEY, // Set your own secret key
      { expiresIn: '1h' } // Token expires in 1 hour
    )

    res.status(200).json({
      token: token,
      expiresIn: 3600,
      message: 'Login successful',
      user: user,
    }) // Send the token and its expiration time
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.get('/user-details/:userId', async (req, res) => {
  try {
    const userId = req.params.userId
    console.log(userId)

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const userDetails = {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      registrationType: user.registrationType,
      state: user.state,
      district: user.district,
      userType: user.userType,
    }

    res.status(200).json(userDetails)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.put('/update-details/:userId', userAuth, async (req, res) => {
  try {
    const userId = req.params.userId
    const { title, data } = req.body

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (title === 'email') {
      const isEmailExist = await User.findOne({ email: data })

      if (isEmailExist) {
        return res.status(401).json({ message: 'Email is already registered' })
      }

      user.email = data
    } else if (title === 'phoneNumber') {
      user.phoneNumber = data
    } else {
      return res.status(400).json({ message: 'Invalid title' })
    }

    await user.save()

    res.status(200).json({ message: 'User details updated successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = userRoute
