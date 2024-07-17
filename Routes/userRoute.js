const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../Middleware/config')
const userRoute = express.Router()
const User = require('../Models/User')
const userAuth = require('../Middleware/userAuth')
const adminAuth = require('../Middleware/adminAuth')
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require('../utils/registrationVerificationMail')

// route to register a new user and send a verification email
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
      userType,
      specialist,
    } = req.body

    const isEmailExist = await User.findOne({ email })

    if (isEmailExist && isEmailExist.isVerified === true) {
      return res.status(401).json({ message: 'Email is already registered' })
    }

    const isMobileExist = await User.findOne({ phoneNumber })

    if (isMobileExist && isMobileExist.isVerified === true) {
      return res
        .status(401)
        .json({ message: 'Mobile number is already registered' })
    }

    if (isEmailExist && isEmailExist.isVerified === false) {
      await User.findByIdAndDelete(isEmailExist._id)
    }

    if (isMobileExist && isMobileExist.isVerified === false) {
      await User.findByIdAndDelete(isMobileExist._id)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const token = jwt.sign({ email }, config.SECRET_KEY, { expiresIn: '2h' })

    let selectedService = []
    if (userType === 'guest') {
      selectedService = ['judgements']
    } else if (userType === 'student') {
      selectedService = ['studyResources']
    } else if (userType === 'lawyer') {
      selectedService = ['judgements', 'legalAdvice', 'studyResources']
    }

    const user = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      registrationType,
      state,
      district,
      userType,
      specialist: userType === 'lawyer' ? specialist : undefined,
      selectedService,
      verificationToken: token,
    })

    console.log(user)

    await user.save()

    // Send verification email
    await sendVerificationEmail(email, token, user.fullName)

    res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Route to send reverification email
userRoute.post('/reverify-email/:email', async (req, res) => {
  try {
    const email = req.params.email

    const user = await User.findOne({ email, isVerified: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const token = jwt.sign({ email }, config.SECRET_KEY, { expiresIn: '2h' })

    user.verificationToken = token

    await user.save()

    await sendVerificationEmail(email, token, user.fullName)

    res.status(200).json({
      message: 'Verification mail sent to your registered email address',
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.post('/login', async (req, res) => {
  try {
    const { emailOrPhoneNumber, password, captchaInput, captchaToken } =
      req.body

    const decoded = jwt.verify(captchaToken, process.env.SECRET_KEY)
    console.log(decoded, captchaInput)
    if (captchaInput !== decoded.captcha) {
      return res.status(401).json({ message: 'Invalid Captcha' })
    }

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
      config.SECRET_KEY,
      { expiresIn: '1h' }
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

// forgot password
userRoute.post('/reset-password/:email', async (req, res) => {
  try {
    const email = req.params.email

    const user = await User.findOne({ email })

    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found', status: 'userNotFound' })
    }

    const token = jwt.sign({ email }, config.SECRET_KEY, { expiresIn: '1h' })

    user.resetPasswordToken = token

    await user.save()

    await sendResetPasswordEmail(email, token, user.fullName)

    res.status(200).json({
      message: 'Password reset link sent to your email',
      status: 'sent',
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const token = req.params.token

    const decodedToken = jwt.verify(token, config.SECRET_KEY)

    const user = await User.findOne({
      email: decodedToken.email,
      resetPasswordToken: token,
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ userId: user._id })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.post('/change-password/:userId', async (req, res) => {
  try {
    const userId = req.params.userId
    const { newPassword } = req.body

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.password = hashedPassword

    user.resetPasswordToken = null

    await user.save()

    res.status(200).json({ message: 'Password changed successfully' })
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
      specialist: user.specialist,
      state: user.state,
      address: user.address,
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
    const data = req.body

    console.log(data)

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isPhoneNumberExist = await User.findOne({
      phoneNumber: data.phoneNumber,
    })

    if (data.phoneNumber !== user.phoneNumber) {
      if (isPhoneNumberExist) {
        return res
          .status(401)
          .json({ error: 'Phone number is already registered' })
      }
    }

    user.phoneNumber = data.phoneNumber ? data.phoneNumber : user.phoneNumber
    user.address = data.address ? data.address : user.address
    user.bio = data.bio ? data.bio : user.bio

    await user.save()

    res.status(200).json({ message: 'User details updated successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

userRoute.post('/create-staff', adminAuth, async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, address } = req.body

    const isEmailExist = await User.findOne({ email })
    if (isEmailExist) {
      return res.status(401).json({ message: 'Email is already registered' })
    }

    const isMobileExist = await User.findOne({ phoneNumber })
    if (isMobileExist) {
      return res
        .status(401)
        .json({ message: 'Phone number is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const staffUser = new User({
      fullName,
      email,
      phoneNumber,
      address,
      password: hashedPassword,
      userType: 'staff',
    })

    await staffUser.save()

    res.status(201).json({ message: 'Staff user registered successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.get('/user-list', userAuth, async (req, res) => {
  try {
    const UserList = await User.find({
      $or: [
        { userType: 'staff' },
        { userType: 'admin' },
        { userType: 'guest' },
        { userType: 'lawyer' },
      ],
    }).select('_id fullName email phoneNumber userType address')

    res.status(200).json(UserList)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

userRoute.delete('/delete-user/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId

    const userToDelete = await User.findById(userId)

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (userToDelete.userType === 'admin') {
      return res.status(403).json({ message: 'Admin user cannot be deleted' })
    }

    await User.findByIdAndDelete(userId)

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

userRoute.put(
  '/update-selected-service/:userId',
  userAuth,
  async (req, res) => {
    try {
      const userId = req.params.userId
      const { selectedService } = req.body

      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      user.selectedService = selectedService

      await user.save()

      res
        .status(200)
        .json({ message: 'Selected services updated successfully' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
)

userRoute.get('/get-selected-service/:userId', userAuth, async (req, res) => {
  try {
    const userId = req.params.userId

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const selectedService = user.selectedService

    res.status(200).json({ selectedService })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = userRoute
