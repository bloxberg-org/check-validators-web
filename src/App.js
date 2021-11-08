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
import logo from './logo.js'
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
  const port = process.env.SERVER_PORT
  const host = process.env.SERVER_HOST
  const URL =
    (process.env.NODE_ENV === 'development'
      ? 'http://' + host + ':' + port
      : window.location.origin) + '/api'

  console.log('URL', URL)
  useEffect(() => {
    axios.get(URL + '/validators').then((res) => {
      console.log('responseresponseresponseresponse', res)
      let count24h = 0
      let count14d = 0
      let alladr = []
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
        setValidators(alladr)
        setOnlineCount14d(count14d)
        setOnlineCount24h(count24h)
      }
    })

    // getValidatorsList()
    //   .then((arr) => {
    //     console.log('Getting validtors', arr)
    //     setValidators(arr)
    //     return arr
    //   })
    //   .then((validators) => {
    //     console.log('Checking last blocks')
    //     async function checkLastBlocks() {
    //       let count24h = 0
    //       let count14d = 0
    //       for (let addr of validators) {
    //         // console.log("Checking last block of " + addr);
    //         try {
    //           // getLastBlock needs to run sequentially and takes time because of API rate limits of the blockexplorer
    //           let lastBlockDate = await getLastBlock(addr)
    //           if (isWithin14d(lastBlockDate)) count14d++
    //           if (isWithin24h(lastBlockDate)) count24h++
    //           setLastBlocks((oldObj) => {
    //             return { ...oldObj, [addr]: lastBlockDate }
    //           })
    //         } catch (err) {
    //           setLastBlocks((oldObj) => {
    //             return { ...oldObj, [addr]: 0 }
    //           })
    //         }
    //       }
    //       setOnlineCount14d(count14d)
    //       setOnlineCount24h(count24h)
    //     }
    //     checkLastBlocks()
    //   })
  }, [])

  const addGraphValidator = (validatorAddr) => {
    setGraphValidators((prevState) => [...prevState, validatorAddr])
  }

  const removeGraphValidator = (validatorAddr) => {
    setGraphValidators((prevState) =>
      prevState.filter((addr) => addr !== validatorAddr),
    )
  }

  const setInstituteName = useCallback((name, addr) => {
    console.log('Setting institution name ' + name + ' ' + addr)
    setValidatorNames((prevState) => ({ ...prevState, [addr]: name }))
  }, [])

  console.log('lastBlockss---', lastBlocks)
  return (
    <Router>
      <Navbar bg="primary" variant="dark">
        <Navbar.Brand>
          <div>
            <a href="/">
              <img src={logo} alt="bloxberg logo" height="32px" />
            </a>
          </div>
        </Navbar.Brand>
        <Nav>
          <Nav.Item>
            <LinkContainer to="/List">
              <Nav.Link>List</Nav.Link>
            </LinkContainer>
          </Nav.Item>
          <Nav.Item>
            <LinkContainer to="/Graph">
              <Nav.Link>Graph</Nav.Link>
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
            setInstituteName={setInstituteName}
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
