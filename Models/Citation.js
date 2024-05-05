const mongoose = require('mongoose')

const citationSchema = new mongoose.Schema({
  institutionName: String,
  index: String,
  apellates: [String],
  type: {
    type: String,
    default: 'judgement',
  },
  caseNo: String,
  partyNameAppealant: String,
  partyNameRespondent: String,
  title: String,
  judgements: String,
  dateOfOrder: Date,
  judgeName: String,
  headNote: String,
  referedJudgements: String,
  laws: [String],
  pointOfLaw: [String],
  equivalentCitations: String,
  advocatePetitioner: String,
  advocateRespondent: String,
  reportable: Boolean,
  overRuled: Boolean,
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
  },
  lastModifiedDate: {
    type: Date,
    default: Date.now,
  },
  citationNo: {
    type: String,
    unique: true,
  },
  uploadedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: String,
  },
})

const Citation = mongoose.model('Citation', citationSchema)

module.exports = Citation
