// model to store case advice requests with file submission

const mongoose = require('mongoose')

const legalAdviceRequestSchema = new mongoose.Schema(
  {
    caseDetails: {
      type: String,
      required: true,
    },
    attachment: {
      data: Buffer,
      contentType: String,
    },
    isAttachment: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: String,
    },
    isFeedback: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

const LegalAdviceRequest = mongoose.model(
  'LegalAdviceRequest',
  legalAdviceRequestSchema
)

module.exports = LegalAdviceRequest
