const abi = require('./abis/RelaySet.abi.json')
const metaDataAbi = require('./abis/ValidatorMetadata.abi.json')
const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://core.bloxberg.org')
const contractAddress = '0x9850711951A84Ef8a2A31a7868d0dCa34B0661cA'
const metaDataContractAddress = '0xF2Cde379d6818Db4a8992ed132345e18e99689e9'

const web3 = new Web3(provider)
const contract = new web3.eth.Contract(abi, contractAddress)
const metaDataContract = new web3.eth.Contract(
  metaDataAbi,
  metaDataContractAddress,
)

const DAYS_AGO = 1 // Number of days to check before.

export const getValidatorsList = () => {
  console.log('Getting validator list from bloxberg Smart Contract')
  return contract.methods.getValidators().call()
}

/**
 * @function to get the isntitute name of a validator.
 *
 * @param {String} address Validator address
 * @returns {String} Research institute name of the validator given in metadata contract. 'N/A' if the address is not within authoritized validators.
 */
export function getInstituteName(address) {
  console.log('Getting institute name of ' + address)
  return metaDataContract.methods
    .validatorsMetadata(address)
    .call()
    .then((result) => {
      if (result.researchInstitute) {
        return result.researchInstitute
      }
      return 'N/A'
    })
}

/**
 * @function to get the timestamp of the last block validated by a validator
 *
 * @param {String} address Address of the validator.
 * @returns {Promise<Number>} that resolves to the timestamp of the last block.
 */
export function getLastBlock(address) {
  console.log('Asking the last block for ' + address)
  return fetch(
    'https://blockexplorer.bloxberg.org/api?module=account&action=getminedblocks&address=' +
      address +
      '&page=1&offset=1',
  )
    .then((res) => {
      console.log('resresres', res)
      return res.json()
    })
    .then((json) => json.result[0].timeStamp)
}
/**
 * @function to check if given Date is within 24 hours.
 *
 * @param {String} dateStr - Date in string. Any string format accepted by new Date()
 * @returns {Boolean}
 */
export function isWithin24h(dateStr) {
  let date = new Date(dateStr)
  let today = Math.round(new Date().getTime() / 1000)
  let yesterday = today - DAYS_AGO * 24 * 3600
  return date >= new Date(yesterday * 1000).getTime()
}

/**
 * @function to check if given Date is within 14 days.
 *
 * @param {String} dateStr - Date in string. Any string format accepted by new Date()
 * @returns {Boolean}
 */
export function isWithin14d(dateStr) {
  let date = new Date(dateStr)
  let today = Math.round(new Date().getTime() / 1000)
  let days14 = today - 14 * 24 * 3600
  return date >= new Date(days14 * 1000).getTime()
}

/**
 * Converts true-false to checkmark-crossmark character.
 *
 * @param {Boolean} bool true or false
 * @returns {String} Checkmark or crossmark
 */
export function getEmoji(bool) {
  return bool ? '✅' : '❌'
}

/**
 * @function to get validated blocks by a validator.
 *
 * @param {String} addr Address of the validator
 * @param {Number} page Page number for paginating results. Defaults to 1
 * @param {Number} offset Number of results to show in each page. Defaults to 100000.
 * @returns {Promise<Array>} Promise that resolves to an array of array of objects representing the validated blocks. Formatted as:
 * @example
 * [
 *  [{}, {}...{}], // Each array of max 1000
 *  [{}, {}...{}],
 *  ...
 *  [... {}]
 * ]
 */
export function getBlocks(addr, page = 1, offset = 1000) {
  console.log('Getting blocks for ' + addr)
  return fetch(
    `https://blockexplorer.bloxberg.org/api?module=account&action=getminedblocks&address=${addr}&page=${page}&offset=${offset}`,
  )
    .then((res) => res.json())
    .then((json) => json.result)
}
