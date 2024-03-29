const mongoose = require('mongoose')
const courtsSchema = new mongoose.Schema({
  name: String,
})

const Courts = mongoose.model('Courts', courtsSchema)
module.exports = Courts
