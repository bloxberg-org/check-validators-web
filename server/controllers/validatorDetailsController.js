const NodeValidator = require('../models/NodeValidatorDetails')

exports.getValidators = async (req, res) => {
  NodeValidator.find()
    .then((nodes) => {
      if (nodes) res.status(200).json(nodes)
      else res.status(404).send('No nodes found')
    })
    .catch((err) => {
      console.log('errerrerr', err)
      res.status(500).send(err)
    })
}
