const mongoose = require("mongoose");
const express = require("express");
const axios = require("axios");
const schedule = require("node-schedule");
var http = require("http");
var https = require("https");
const cors = require("cors");

// keep me alive axios request for single connection

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const axioInstance = axios.create({
  httpAgent,
  httpsAgent,
});

// ====== Main config  ========

const app = express();
const port = process.env.PORT || 3000;

// Apply CORS middleware to the entire app or specific routes
app.use(cors({
  origin: '*' // Replace with your React app's origin
}));

app.listen(port, () => {
  console.log("Express Listening at http://localhost:" + port);
});

// ====== Connect Mongo ========
const config = require("./config");
const dbConfig = config.database;
const dbURI = config.databaseURI;
mongoose.connect(dbURI, dbConfig);
const db = mongoose.connection;

db.on("error", (err) => {
  console.log("> error occurred from the database", err);
});

db.once("open", () => {
  console.log("> successfully opened the database");
  const abi = require("./abis/RelaySet.abi.json");
  const metaDataAbi = require("./abis/ValidatorMetadata.abi.json");
  const Web3 = require("web3");
  const provider = new Web3.providers.HttpProvider("https://core.bloxberg.org");
  const contractAddress = "0x9850711951A84Ef8a2A31a7868d0dCa34B0661cA";
  const metaDataContractAddress = "0xF2Cde379d6818Db4a8992ed132345e18e99689e9";

  const web3 = new Web3(provider);
  const contract = new web3.eth.Contract(abi, contractAddress);
  const metaDataContract = new web3.eth.Contract(
    metaDataAbi,
    metaDataContractAddress
  );
  const NodeValidatorDetails = require("./models/NodeValidatorDetails");
  const DAYS_AGO = 1;
  const validatorRoutes = require("./routes/validatorDetails");

  app.use("/api/validators", validatorRoutes);

  app.get("/", validatorRoutes);

  const getInstituteName = (address) => {
    return metaDataContract.methods
      .validatorsMetadata(address)
      .call()
      .then((result) => {
        if (result.researchInstitute) {
          return result.researchInstitute;
        }
        return "N/A";
      });
  };

  const isWithin24h = (dateStr) => {
    let date = new Date(dateStr);
    let today = Math.round(new Date().getTime() / 1000);
    let yesterday = today - DAYS_AGO * 24 * 3600;
    return date >= new Date(yesterday * 1000).getTime();
  };

  const isWithin14d = (dateStr) => {
    let date = new Date(dateStr);
    let today = Math.round(new Date().getTime() / 1000);
    let days14 = today - 14 * 24 * 3600;
    return date >= new Date(days14 * 1000).getTime();
  };

  const getLastBlock = (address) => {
    console.log("Asking the last block for " + address);
    return axios
      .get(
        "https://blockexplorer.bloxberg.org/api?module=account&action=getminedblocks&address=" +
          address +
          "&page=1&offset=1",
        { httpsAgent }
      )
      .then((res) => {
        let finalData = {};
        if (res.data.result[0]) {
          let datedata = res.data.result[0].timeStamp;
          (finalData.lastseenonline = datedata),
            (finalData.onlinein24h = isWithin24h(datedata));
          finalData.onlinein14d = isWithin14d(datedata);
          return finalData;
        } else {
          return true;
        }
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(
            "The request was made and the server responded with a status code"
          );
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log("The request was made but no response was received");
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log(
            "Something happened in setting up the request that triggered an Error"
          );
          console.log("Error", error.message);
        }
        console.log(error.config);
      });
  };

  const getValidatorsList = async () => {
    let allAddress = await contract.methods.getValidators().call();
    for (let addr of allAddress) {
      NodeValidatorDetails.findById(addr).then((validatorNode) => {
        if (!validatorNode) {
          getInstituteName(addr).then((fetchedName) => {
            let saveValidatorDetails = new NodeValidatorDetails({
              _id: addr,
              name: fetchedName,
            });
            saveValidatorDetails
              .save()
              .then(() => {
                console.log("Successfully saved the data");
              })
              .catch((err) => console.log(err));
          });
        }
      });
    }
    saveBlockDetails(allAddress);
    return allAddress;
  };

  const saveBlockDetails = async (validatorsAddr) => {
    if (validatorsAddr) {
      for (let i = 0; i < validatorsAddr.length; i++) {
        setDelay(i, validatorsAddr[i]);
      }
    }
  };

  function setDelay(i, addr) {
    setTimeout(async () => {
      let lastblkdata = await getLastBlock(addr);
      if (lastblkdata) {
        lastblkdata.name = await getInstituteName(addr);
        console.log("lastblkdata", lastblkdata, i);
        NodeValidatorDetails.findOne({ _id: addr })
          .then((data) => {
            NodeValidatorDetails.updateOne({ _id: addr }, lastblkdata)
              .then((data) => {})
              .catch((err) => console.log("Err", err));
          })
          .catch((err) => console.log("Err", err));
      }
    }, 500 * i);
  }

  Array.prototype.diff = function (a) {
    return this.filter(function (i) {
      return a.indexOf(i) < 0;
    });
  };

  const cleanDb = async () => {
    let allAddress = await contract.methods.getValidators().call();
    NodeValidatorDetails.find({}, { _id: 1 })
      .then((data) => {
        let dbAddress = data.map(function (item) {
          return item._id;
        });
        let difference = dbAddress.filter((x) => !allAddress.includes(x));
        if (difference.length !== 0) {
          difference.map(function (id) {
            NodeValidatorDetails.deleteMany({ _id: id }, (err, result) => {
              console.log("Db cleaned successfully");
            });
          });
        }
      })
      .catch((err) => console.log("Err", err));
  };

  getValidatorsList();
  cleanDb();

  // ====== Cron Job ========

  const cronstrue = require("cronstrue");
  // const cronSchedule = '0 15 0 * * *'
  const cronSchedule = "0 */12 * * *";

  const cronScheduleForCleaning = "0 0 * * 0,4";

  console.log(
    "The script is scheduled to run " +
      cronstrue.toString(cronSchedule, {
        use24HourTimeFormat: true,
        verbose: true,
      })
  );

  console.log(
    "The script is scheduled to run cronScheduleForCleaning" +
      cronstrue.toString(cronScheduleForCleaning, {
        use24HourTimeFormat: true,
        verbose: true,
      })
  );

  schedule.scheduleJob(cronSchedule, getValidatorsList);
  schedule.scheduleJob(cronScheduleForCleaning, cleanDb);
});
