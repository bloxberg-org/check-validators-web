import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Graph from './Graph';

export default function GraphPage({ graphValidators, blockData, setBlocksData, validatorNames }) {

  // Render graphs sequentially. 
  // First item in the array is true. Push false values of length graphValidators.
  // Upon each completed render, set next canRender true to render the next one.
  let tempCanRender = [true]
  for (let i = 0; i < graphValidators.length; i++)
    tempCanRender.push(false);
  const [canRender, setCanRender] = useState(tempCanRender); // Array of size graphvalidators+1

  /**
   * Mark next validator to be rendered.
   * 
   * @param {Number} index index of the validator successfully rendered
   */
  function nextCanRender(index) {
    console.log('Index ' + (index + 1) + ' can render!');
    setCanRender(prevState => {
      let tempState = [...prevState]
      tempState[index + 1] = true;
      return tempState;
    })
  }

  if (graphValidators.length === 0) {
    return (
      <Container fluid className="h-100 d-flex justify-content-center align-items-center">
        <div>
          To view a graph add a validator from the list
        </div>
      </Container>
    )
  }
  return (
    <Container fluid>
      <p className="m-2">
        View the uptimes of validators on graphs.
      </p>
      <p className="m-2">
        <span style={{ color: "green" }}>Green</span> fields represent online times and <span style={{ color: "red" }}>red</span> fields show offline times meaning at least one block is validated within given time interval.
      </p>
      <p className="m-2">
        You can view the hours online by toggling days/hours. Click "Load Before" to view earlier dates. All times are UTC.
      </p>
      <p className="m-2">
        Scroll with mouse to zoom in-out. Move the graph by left clicking the mouse and sliding the graph.
      </p>
      {
        graphValidators.map((validatorAddr, i) => {
          return (
            <Row className='my-4' key={i}>
              <Graph
                canRender={canRender[i]}
                nextCanRender={() => nextCanRender(i)}
                name={validatorNames[validatorAddr]}
                validator={validatorAddr}
                rawData={blockData[validatorAddr]}
                setRawData={(data) => setBlocksData(prevState => { return { ...prevState, [validatorAddr]: data } })}
              />
            </Row>
          )
        })
      }
    </Container>
  )
}