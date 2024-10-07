import React, { useCallback, useEffect, useState } from 'react'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import { LinkContainer } from 'react-router-bootstrap'
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom'
import GraphPage from './GraphPage'
import logo from './bloxberg_logo.png'
import {
  getLastBlock,
  getValidatorsList,
  isWithin14d,
  isWithin24h,
} from './utils'
import ValidatorsList from './ValidatorList'
import axios from 'axios'

function App() {
  const [validators, setValidators] = useState([])
  // List of validators to be shown on the graph.
  const [graphValidators, setGraphValidators] = useState([])
  /**
   * lastBlocks: {
   *   0xaA84378...FbEBFC8: <Date>,
   *   0x841C25A...b65A79b: <Date:
   * }
   */
  const [lastBlocks, setLastBlocks] = useState({})
  const [onlineCount24h, setOnlineCount24h] = useState()
  const [onlineCount14d, setOnlineCount14d] = useState()
  // Keep raw data from Graphs to avoid having to fetch data again when going back to /Graph. Graph will just render data fetched and saved here.
  const [blockData, setBlocksData] = useState({})
  const [validatorNames, setValidatorNames] = useState({})

  var API_URI = 'http://localhost:9000'

  // if (process.env.NODE_ENV === 'development') {
  //   API_URI = 'http://localhost:9000'
  // }
  // else if (process.env.NODE_ENV === 'test') {
  //   API_URI = 'https://' + process.env.REACT_APP_API_HOST_QA
  // }

  const URL = API_URI + '/api'

  useEffect(() => {
    axios.get(URL + '/validators').then((res) => {
      let count24h = 0
      let count14d = 0
      let alladr = []
      let allValidatorsNames = {}

      if (!res.data[0].lastseenonline) {
        getValidatorsList()
          .then((arr) => {
            console.log('Getting validtors', arr)
            setValidators(arr)
            return arr
          })
          .then((validators) => {
            console.log('Checking last blocks')
            async function checkLastBlocks() {
              let count24h = 0
              let count14d = 0
              for (let addr of validators) {
                // console.log("Checking last block of " + addr);
                try {
                  // getLastBlock needs to run sequentially and takes time because of API rate limits of the blockexplorer
                  let lastBlockDate = await getLastBlock(addr)
                  if (isWithin14d(lastBlockDate)) count14d++
                  if (isWithin24h(lastBlockDate)) count24h++
                  setLastBlocks((oldObj) => {
                    return { ...oldObj, [addr]: lastBlockDate }
                  })
                } catch (err) {
                  setLastBlocks((oldObj) => {
                    return { ...oldObj, [addr]: 0 }
                  })
                }
              }
              setOnlineCount14d(count14d)
              setOnlineCount24h(count24h)
            }
            checkLastBlocks()
          })
      } else {
        for (let alldata of res.data) {
          if (alldata.lastseenonline) {
            allValidatorsNames[alldata._id]=alldata.name
            alladr.push(alldata._id)
            setLastBlocks((oldObj) => {
              return { ...oldObj, [alldata._id]: alldata.lastseenonline }
            })
            if (alldata.onlinein14d) {
              count14d++
            }
            if (alldata.onlinein24h) {
              count24h++
            }
          }
        }
        setValidatorNames(allValidatorsNames)
        setValidators(alladr)
        setOnlineCount14d(count14d)
        setOnlineCount24h(count24h)
      }
    })
  }, [])

  const addGraphValidator = (validatorAddr) => {
    setGraphValidators((prevState) => [...prevState, validatorAddr])
  }

  const removeGraphValidator = (validatorAddr) => {
    setGraphValidators((prevState) =>
      prevState.filter((addr) => addr !== validatorAddr),
    )
  }

  // const setInstituteName = useCallback((name, addr) => {
  //   // console.log('Setting institution name ' + name + ' ' + addr)
  //   setValidatorNames((prevState) => ({ ...prevState, [addr]: name }))
  // }, [])

  return (
    <Router>
      <Navbar variant="dark">
        <Navbar.Brand>
          <div>
            <a href="https://bloxberg.org">
              <img src={logo} alt="bloxberg logo" width="150px" />
            </a>
          </div>
        </Navbar.Brand>
        <Nav>
          <Nav.Item>
            <LinkContainer to="/List">
              <Nav.Link activeclassname="active">List</Nav.Link>
            </LinkContainer>
          </Nav.Item>
          <Nav.Item>
            <LinkContainer to="/Graph">
              <Nav.Link activeclassname="active">Graph</Nav.Link>
            </LinkContainer>
          </Nav.Item>
        </Nav>
      </Navbar>
      <Switch>
        <Route path="/List">
          <ValidatorsList
            validators={validators}
            lastBlocks={lastBlocks}
            onlineCount14d={onlineCount14d}
            onlineCount24h={onlineCount24h}
            addGraphValidator={addGraphValidator}
            removeGraphValidator={removeGraphValidator}
            graphValidators={graphValidators}
            validatorNames={validatorNames}
          />
        </Route>
        <Route path="/Graph">
          <GraphPage
            validatorNames={validatorNames}
            graphValidators={graphValidators}
            blockData={blockData}
            setBlocksData={setBlocksData}
          />
        </Route>
        <Route path="/">
          <Redirect to="/List" />
        </Route>
      </Switch>
    </Router>
  )
}

export default App
