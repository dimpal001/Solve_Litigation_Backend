const mongoose = require('mongoose')
const lawsSchema = new mongoose.Schema({
  name: String,
})

const Laws = mongoose.model('Laws', lawsSchema)
module.exports = Laws
