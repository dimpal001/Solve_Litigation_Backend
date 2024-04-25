const { verify } = require('jsonwebtoken')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String, required: true },
  password: String,
  state: String,
  district: String,
  userType: String,
  registrationType: String,
  address: String,
  selectedService: {
    type: [String],
    enum: ['judgments', 'legalAdvice', 'studyResources'],
    default: [],
  },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
})

const User = mongoose.model('User', userSchema)
module.exports = User
