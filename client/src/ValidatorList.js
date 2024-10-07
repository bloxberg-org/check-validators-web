import { PlusIcon, TrashIcon } from '@primer/octicons-react'
import moment from 'moment'
import React, { useEffect } from 'react'
import { Button } from 'react-bootstrap'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import './Table.css'
import check from './check.svg'
import wrong from './cross.svg'
import remove from './delete.svg'
import add from './add.svg'
import diamond from './diamond.png'

import { getEmoji, getInstituteName, isWithin14d, isWithin24h } from './utils'

export default function ValidatorList({
  validators,
  lastBlocks,
  onlineCount14d,
  onlineCount24h,
  addGraphValidator,
  removeGraphValidator,
  graphValidators,
  validatorNames,
}) {
  let validatorTable
  if (validators.length === 0) {
    validatorTable = (
      <Spinner
        animation="border"
        role="status"
        style={{ width: '100px', height: '100px' }}
      >
        <span className="sr-only">Loading...</span>
      </Spinner>
    )
  } else {
    validatorTable = (
      <Table striped bordered hover variant="light">
        <thead>
          <tr>
            <th>Institute Name</th>
            <th>Address</th>
            <th className="text-center">Online in 24h</th>
            <th className="text-center">Online in 14 days</th>
            <th className="text-center">Last seen online</th>
            <th className="text-center">Show in graph</th>
          </tr>
        </thead>
        <tbody>
          {validators.map((addr, i) => {
            return (
              <InstituteRow
                address={addr}
                lastBlock={lastBlocks[addr]}
                addedToGraph={graphValidators.includes(addr)}
                addGraphValidator={() => addGraphValidator(addr)}
                removeGraphValidator={() => removeGraphValidator(addr)}
                name={validatorNames[addr]}
                key={i}
              />
            )
          })}
        </tbody>
      </Table>
    )
  }

  return (
    <Container>
      <Row className="text d-flex justify-content-center my-2">
        <img className="sw-diamond" src={diamond} alt="" />
        <h1 class="sectionTitle">bloxberg Validators status</h1>
      </Row>
      {/* <Row className="justify-content-center text-center m-2">
        Here you can see the authority nodes in the&nbsp;
        <a href="https://bloxberg.org">bloxberg</a>&nbsp;network.
      </Row>
      <Row className="justify-content-center text-center m-2">
        Loading the validator statuses takes a little time and runs
        sequentially.
      </Row>
      <Row className="justify-content-center text-center m-2">
        Choose validators to view in &nbsp;
        <strong>detailed uptime graph</strong>&nbsp; by clicking &nbsp;
        <strong>+</strong>&nbsp; on the right and go to the &nbsp;
        <strong>Graph</strong>&nbsp; page above.
      </Row> */}
      <Row className="my-3">
        <Col>
          <Row className="text justify-content-center font-weight-bold">
            Validators online in 24 hours
          </Row>
          <Row className="text justify-content-center">
            {onlineCount24h ? (
              `${onlineCount24h}/${validators.length}`
            ) : (
              <Spinner animation="border" role="status" />
            )}
          </Row>
        </Col>
        <Col>
          <Row className="text justify-content-center font-weight-bold">
            Validators online in 14 days
          </Row>
          <Row className="text justify-content-center">
            {onlineCount24h ? (
              `${onlineCount14d}/${validators.length}`
            ) : (
              <Spinner animation="border" role="status" />
            )}
          </Row>
        </Col>
      </Row>
      <Row>
        <Col className="text d-flex justify-content-center">
          {validatorTable}
        </Col>
      </Row>
    </Container>
  )
}

/**
 * Component representing a row in the validators table
 * If lastBlock is falsey, renders a spinner. Otherwise renders a checkmark or crossmark if the last block is within 24 hours and 14 days for each cell.
 */
function InstituteRow({
  address,
  lastBlock,
  addGraphValidator,
  removeGraphValidator,
  addedToGraph,
  name,
}) {
  return (
    <tr>
      {/* Show spinner until name is fetched. */}
      <td>
        {name ? (
          name
        ) : (
          <div className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </td>
      {/* Show the address */}
      <td>
        <a
          style={{ color: 'inherit' }}
          href={`https://blockexplorer.bloxberg.org/address/${address}/validations`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {address}
        </a>
      </td>
      {/* Check if last block within 24 hours. Show spinner until fetched. */}
      <td>
        <div className="d-flex justify-content-center align-items-center">
          {lastBlock ? (
            isWithin24h(lastBlock) ? (
              <img src={check} height="30px" />
            ) : (
              <img src={wrong} height="30px" />
            )
          ) : (
            <Spinner animation="border" size="sm" />
          )}
        </div>
      </td>
      {/* Check if last block within 14 days. Show spinner until fetched. */}
      <td>
        <div className="d-flex justify-content-center align-items-center">
          {lastBlock === 0 ? (
            '?' // If fetch fails show '?'
          ) : lastBlock ? (
            isWithin14d(lastBlock) ? (
              <img src={check} height="30px" />
            ) : (
              <img src={wrong} height="30px" />
            )
          ) : (
            <Spinner animation="border" size="sm" />
          )}
        </div>
      </td>
      {/* Show last seen */}
      <td>
        <div className="text-center last-seen">
          {lastBlock ? (
            <div>
              <div>{moment.utc(lastBlock).format('DD MMM YYYY')}</div>
              <div>{moment.utc(lastBlock).format('HH:mm') + ' UTC'}</div>
            </div>
          ) : (
            <Spinner animation="border" size="sm" />
          )}
        </div>
      </td>
      <td className="text-center">
        {addedToGraph ? (
          <Button
            onClick={removeGraphValidator}
            style={{ all: 'unset'}}
          >
             <img src={remove} height="37px" />
          </Button>
        ) : (
          <Button
            onClick={addGraphValidator}
            style={{ all: 'unset'}}
          >
            <img src={add} height="37px" />
          </Button>
        )}
      </td>
    </tr>
  )
}
