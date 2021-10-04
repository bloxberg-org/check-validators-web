const mongoose = require('mongoose')

const NodeValidatorDetailsSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    lastseenonline: Date,
    onlinein24h: Boolean,
    onlinein14d: Boolean,
  },
  { timestamps: true },
)

module.exports = mongoose.model(
  'NodeValidatorDetails',
  NodeValidatorDetailsSchema,
)
