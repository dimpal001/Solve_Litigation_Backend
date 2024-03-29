const mongoose = require('mongoose')
const contentsSchema = new mongoose.Schema({
  name: String,
})

const Contents = mongoose.model('Contents', contentsSchema)
module.exports = Contents
