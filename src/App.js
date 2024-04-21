import React, { useEffect, useState } from "react";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { LinkContainer } from "react-router-bootstrap";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import GraphPage from "./GraphPage";
import logo from "./bloxberg_logo.png";
import ValidatorsList from "./ValidatorList";
import axios from "axios";

function App() {
  const [validators, setValidators] = useState([]);
  const [graphValidators, setGraphValidators] = useState([]);
  const [lastBlocks, setLastBlocks] = useState({});
  const [onlineCount24h, setOnlineCount24h] = useState();
  const [onlineCount14d, setOnlineCount14d] = useState();
  // Keep raw data from Graphs to avoid having to fetch data again when going back to /Graph. Graph will just render data fetched and saved here.
  const [blockData, setBlocksData] = useState({});
  const [validatorNames, setValidatorNames] = useState({});

  const URL = "http://localhost:3001/api";

  // if (process.env.NODE_ENV === "dev") {
  //   URL = "https://localhost:9000/api";
  // } else if (process.env.NODE_ENV === "prod") {
  //   URL = "https://" + process.env.REACT_APP_SERVER_HOST + "/api";
  // }

  useEffect(() => {
    axios.get(URL + "/validators").then((res) => {
      let count24h = 0;
      let count14d = 0;
      let alladr = [];
      let allValidatorsNames = {};
      for (let alldata of res.data) {
        if (alldata.lastseenonline) {
          allValidatorsNames[alldata._id] = alldata.name;
          alladr.push(alldata._id);
          setLastBlocks((oldObj) => {
            return { ...oldObj, [alldata._id]: alldata.lastseenonline };
          });
          if (alldata.onlinein14d) {
            count14d++;
          }
          if (alldata.onlinein24h) {
            count24h++;
          }
        }
      }
      setValidatorNames(allValidatorsNames);
      setValidators(alladr);
      setOnlineCount14d(count14d);
      setOnlineCount24h(count24h);
    });
  }, []);

  const addGraphValidator = (validatorAddr) => {
    setGraphValidators((prevState) => [...prevState, validatorAddr]);
  };

  const removeGraphValidator = (validatorAddr) => {
    setGraphValidators((prevState) =>
      prevState.filter((addr) => addr !== validatorAddr)
    );
  };

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
  );
}

export default App;
