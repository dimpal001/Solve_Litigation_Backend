const mongoose = require('mongoose')
const apellateTypeSchema = new mongoose.Schema({
  name: String,
})

const ApellateType = mongoose.model('ApellateType', apellateTypeSchema)
module.exports = ApellateType
