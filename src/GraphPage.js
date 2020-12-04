import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Graph from './Graph';

export default function GraphPage({ graphValidators, blockData, setBlocksData, validatorNames }) {
  let tempCanRender = [true]
  for (let i = 0; i < graphValidators.length; i++)
    tempCanRender.push(false);
  const [canRender, setCanRender] = useState(tempCanRender); // Array of size graphvalidators+1


  function nextCanRender(index) {
    console.log('Index ' + (index + 1) + ' can render!');
    setCanRender(prevState => {
      let tempState = [...prevState]
      tempState[index + 1] = true;
      return tempState;
    })
  }

  return (
    <Container fluid>
      {
        graphValidators.map((validatorAddr, i) => {
          return (
            <Row className='my-4'>
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