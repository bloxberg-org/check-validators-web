const NodeValidator = require('../models/NodeValidatorDetails')

exports.getValidators = async (req, res) => {
  NodeValidator.find()
    .then((nodes) => {
      if (nodes) res.status(200).json(nodes)
      else res.status(200).send('Database building')
    })
    .catch((err) => {
      console.log('errerrerr', err)
      res.status(500).send(err)
    })
}
