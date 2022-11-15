const mongoose = require('mongoose')
const express = require('express')
var morgan = require('morgan')
const axios = require('axios')
var cors = require('cors')
const schedule = require('node-schedule')
var async = require('async')
var http = require('http')
var https = require('https')

// test for keep me alive

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

const axioInstance = axios.create({
  httpAgent,
  httpsAgent,
})

// ====== Main config  ========

const app = express()
const port = process.env.PORT || 3000

// ====== Connect Mongo ========
const config = require('./config')
const dbConfig = config.database
const dbURI = config.databaseURI
mongoose.connect(dbURI, dbConfig)
const db = mongoose.connection

db.on('error', (err) => {
  console.log('> error occurred from the database', err)
})
db.on('open', () => {
  console.log('> successfully opened the database')
})

// ====== Connect morgan HTTP
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

app.listen(port, () => {
  console.log('Express Listening at http://localhost:' + port)
})

// ====== Contract Call ========
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
const NodeValidatorDetails = require('./models/NodeValidatorDetails')
const DAYS_AGO = 1
const validatorRoutes = require('./routes/validatorDetails')

app.use('/api/validators', validatorRoutes)

app.get('/', validatorRoutes)

let validatorsAddr = []

const getInstituteName = (address) => {
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

const isWithin24h = (dateStr) => {
  let date = new Date(dateStr)
  let today = Math.round(new Date().getTime() / 1000)
  let yesterday = today - DAYS_AGO * 24 * 3600
  return date >= new Date(yesterday * 1000).getTime()
}

const isWithin14d = (dateStr) => {
  let date = new Date(dateStr)
  let today = Math.round(new Date().getTime() / 1000)
  let days14 = today - 14 * 24 * 3600
  return date >= new Date(days14 * 1000).getTime()
}

const getLastBlock = (address) => {
  console.log('Asking the last block for ' + address)
  return axios
    .get(
      'https://blockexplorer.bloxberg.org/api?module=account&action=getminedblocks&address=' +
        address +
        '&page=1&offset=1',
      { httpsAgent },
    )
    .then((res) => {
      let finalData = {}
      if (res.data.result[0]) {
        let datedata = res.data.result[0].timeStamp
        ;(finalData.lastseenonline = datedata),
          (finalData.onlinein24h = isWithin24h(datedata))
        finalData.onlinein14d = isWithin14d(datedata)
        return finalData
      } else {
        return true
      }
    })
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
      }
      console.log(error.config)
    })
}

const getValidatorsList = async () => {
  // console.log('Getting validator list from bloxberg Smart Contract')
  let allAddress = await contract.methods.getValidators().call()
  validatorsAddr = allAddress
  async.waterfall(
    [
      function firstStep(done) {
        NodeValidatorDetails.deleteMany({}, function (err, result) {
          done(null, 'cleared database')
        })
      },
      function secondStep(step1Result, done) {
        console.log(step1Result)
        for (let addr of allAddress) {
          NodeValidatorDetails.findById(addr).then((validatorNode) => {
            if (!validatorNode) {
              getInstituteName(addr).then((fetchedName) => {
                let saveValidatorDetails = new NodeValidatorDetails({
                  _id: addr,
                  name: fetchedName,
                })
                saveValidatorDetails
                  .save()
                  .then(() => {
                    // console.log('Successfully saved the data')
                  })
                  .catch((err) => console.log(err))
              })
            }
          })
        }
        done(null, 'Successfully saved the data')
      },
      async function ThirdStep(step2Result) {
        console.log(step2Result)
        for (let addr of validatorsAddr) {
          let lastblkdata = await getLastBlock(addr)
          // console.log('Updating lastblkdata for ' + addr + ': ' + lastblkdata)
          NodeValidatorDetails.findOne({ _id: addr })
            .then((data) => {
              NodeValidatorDetails.updateOne({ _id: addr }, lastblkdata)
                .then((data) => {
                  // console.log('Update complete: ', data)
                })
                .catch((err) => console.log('Err', err))
            })
            .catch((err) => console.log('Err', err))
        }
      },
    ],
    function (err) {
      if (err) {
        throw new Error(err)
      } else {
        console.log('No error happened in any steps, operation done!')
      }
    },
  )
}

getValidatorsList()

// ====== Cron Job ========

const cronstrue = require('cronstrue')
const cronSchedule = '0 15 0 * * *'

console.log(
  'The script is scheduled to run ' +
    cronstrue.toString(cronSchedule, {
      use24HourTimeFormat: true,
      verbose: true,
    }),
)

schedule.scheduleJob(cronSchedule, getValidatorsList)
