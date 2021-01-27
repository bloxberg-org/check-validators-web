import React, { useCallback, useEffect, useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { LinkContainer } from 'react-router-bootstrap';
import {
  BrowserRouter as Router,
  Redirect,
  Route, Switch
} from "react-router-dom";
import GraphPage from './GraphPage';
import logo from './logo.js';
import { getLastBlock, getValidatorsList, isWithin14d, isWithin24h } from './utils';
import ValidatorsList from './ValidatorList';

function App() {
  const [validators, setValidators] = useState([]);
  const [graphValidators, setGraphValidators] = useState([]);
  const [lastBlocks, setLastBlocks] = useState({});
  const [onlineCount24h, setOnlineCount24h] = useState();
  const [onlineCount14d, setOnlineCount14d] = useState();
  const [blockData, setBlocksData] = useState({});
  const [validatorNames, setValidatorNames] = useState({});

  useEffect(() => {
    getValidatorsList()
      .then((arr) => {
        console.log('Getting validtors')
        setValidators(arr);
        return arr;
      })
      .then((validators) => {
        console.log('Checking last blocks');
        async function checkLastBlocks() {
          let count24h = 0;
          let count14d = 0;
          for (let addr of validators) {
            // console.log("Checking last block of " + addr);
            try {
              let lastBlockDate = await getLastBlock(addr);
              if (isWithin14d(lastBlockDate))
                count14d++
              if (isWithin24h(lastBlockDate))
                count24h++
              setLastBlocks(oldObj => {
                return { ...oldObj, [addr]: lastBlockDate }
              });
            } catch (err) {
              setLastBlocks(oldObj => {
                return { ...oldObj, [addr]: 0 }
              });
            }
          }
          setOnlineCount14d(count14d);
          setOnlineCount24h(count24h);
        }
        checkLastBlocks();
      })
  }, [])

  useEffect(() => {

  }, [validators]);

  const addGraphValidator = (validatorAddr) => {
    setGraphValidators(prevState => [...prevState, validatorAddr]);
  }

  const removeGraphValidator = (validatorAddr) => {
    setGraphValidators(prevState => prevState.filter(addr => addr !== validatorAddr));
  }

  const setInstituteName = useCallback((name, addr) => {
    console.log('Setting institution name ' + name + ' ' + addr)
    setValidatorNames(prevState => ({ ...prevState, [addr]: name }));
  }, [])

  return (
    <Router>
      <Navbar bg="primary" variant="dark">
        <Navbar.Brand>
          <div>
            <a href='/'>
              <img src={logo} alt='bloxberg logo' height='32px' />
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
          <Redirect to='/List' />
        </Route>
      </Switch>
    </Router>
  )
}

export default App;
