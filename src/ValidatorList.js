import { PlusIcon, TrashIcon } from '@primer/octicons-react';
import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { getEmoji, getInstituteName, isWithin14d, isWithin24h } from './utils';

export default function ValidatorList({ validators, lastBlocks, onlineCount14d, onlineCount24h, addGraphValidator, removeGraphValidator, graphValidators, setInstituteName, validatorNames }) {
  let validatorTable;
  if (validators.length === 0) {
    validatorTable =
      <Spinner animation="border" role="status" style={{ width: '100px', height: '100px' }}>
        <span className="sr-only">Loading...</span>
      </Spinner>;
  } else {
    validatorTable =
      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>Institute Name</th>
            <th>Address</th>
            <th>Online in 24h?</th>
            <th>Online in 14 days?</th>
            <th>Show in graph</th>
          </tr>
        </thead>
        <tbody>
          {
            validators.map((addr, i) => {
              return <InstituteRow
                address={addr}
                lastBlock={lastBlocks[addr]}
                addedToGraph={graphValidators.includes(addr)}
                addGraphValidator={() => addGraphValidator(addr)}
                removeGraphValidator={() => removeGraphValidator(addr)}
                setInstituteName={setInstituteName}
                name={validatorNames[addr]}
                key={i}
              />
            })
          }
        </tbody>
      </Table>
  }

  return (
    <Container fluid>
      <Row fluid className="d-flex justify-content-center">
        <h1>
          Validators
        </h1>
      </Row>
      <Row>
        <Col>
          <Row className="justify-content-center">
            Validators online in 24 hours
          </Row>
          <Row className="justify-content-center">
            {onlineCount24h ? `${onlineCount24h}/${validators.length}` : <Spinner animation="border" role="status" />}
          </Row>
        </Col>
        <Col>
          <Row className="justify-content-center">
            Validators online in 14 days
          </Row>
          <Row className="justify-content-center">
            {onlineCount24h ? `${onlineCount14d}/${validators.length}` : <Spinner animation="border" role="status" />}
          </Row>
        </Col>
      </Row>
      <Row >
        <Col className="d-flex justify-content-center">
          {validatorTable}
        </Col>
      </Row>
    </Container>
  );
}


/**
 * Component representing a row in the validators table
 * If lastBlock is falsey, renders a spinner. Otherwise renders a checkmark or crossmark if the last block is within 24 hours and 14 days for each cell. 
 */
function InstituteRow({ address, lastBlock, addGraphValidator, removeGraphValidator, addedToGraph, name, setInstituteName, key }) {
  // Get institute name upon mounting.
  useEffect(() => {
    if (!name) {
      getInstituteName(address).then((fetchedName => {
        setInstituteName(fetchedName, address);
      }))
    }
  }, [setInstituteName, address, name]);

  return (
    <tr>
      {/* Show the name. */}
      <td>
        {
          name ?
            name :
            <div className="d-flex justify-content-center">
              <Spinner animation="border" size='sm' />
            </div>
        }
      </td>
      {/* Show the address */}
      <td>
        <a style={{ color: 'inherit' }} href={`https://blockexplorer.bloxberg.org/address/${address}/validations`} target="_blank" rel="noopener noreferrer">{address}</a>
      </td>
      {/* Check if last block within 24 hours */}
      <td>
        <div className="d-flex justify-content-center">
          {
            lastBlock ?
              getEmoji(isWithin24h(lastBlock)) :
              <Spinner animation="border" size='sm' />
          }
        </div>
      </td>
      {/* Check if last block within 14 days */}
      <td>
        <div className="d-flex justify-content-center">
          {
            lastBlock === 0 ? '?' : // If fetch fails show '?'
              lastBlock ?
                getEmoji(isWithin14d(lastBlock)) :
                <Spinner animation="border" size='sm' />
          }
        </div>
      </td>
      <td>
        {addedToGraph
          ? <Button onClick={removeGraphValidator} variant="danger" >
            <TrashIcon size={16} />
          </Button >
          : <Button onClick={addGraphValidator} variant="dark">
            <PlusIcon size={16} />
          </Button>
        }
      </td>
    </tr>
  )
}
