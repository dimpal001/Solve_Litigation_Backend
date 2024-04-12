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
})

const User = mongoose.model('User', userSchema)
module.exports = User
