import moment from 'moment';
import { Index, IndexedEvent, TimeRange, TimeSeries } from "pondjs";
import React from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import {
  ChartContainer,
  ChartRow, Charts,
  EventChart
} from "react-timeseries-charts";
import { getBlocks } from './utils';

export default class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoadingMore: false,
      timeseries: null,
      timerange: new TimeRange(moment().subtract(7, 'days'), moment()), // Timerange to be shown by the graph
      page: 0,
      offset: 10000,
      seeDays: true
    }
  }

  componentDidMount() {
    if (!this.props.canRender)
      return;
    if (this.props.rawData) {
      this.props.nextCanRender()
      this.blocksToTimeseries(this.props.rawData)
    } else {
      this.getBlocksBefore()
        .then(this.blocksToTimeseries)
        .then(this.props.nextCanRender)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.canRender && !prevProps.canRender) {
      console.log("Now " + this.props.validator + " can update!")
      if (this.props.rawData) {
        this.props.nextCanRender()
        this.blocksToTimeseries(this.props.rawData)
      } else {
        this.getBlocksBefore()
          .then(this.blocksToTimeseries)
          .then(this.props.nextCanRender)
      }
    }
  }

  blocksToTimeseries = (blocks) => {
    let blocksStartDate = moment(blocks[blocks.length - 1].timeStamp);
    console.log('Existing earliest block is at: ', blocksStartDate.format());
    this.props.setRawData(blocks);

    let dateObject;
    console.log('seeDays is ', this.state.seeDays);
    if (this.state.seeDays)
      dateObject = this.createDaysObject(blocksStartDate, this.state.displayEndDate);
    else
      dateObject = this.createHoursObject(blocksStartDate, this.state.displayEndDate);
    this.iterateValidatedBlocks(blocks, dateObject);
    console.log('Iterated dateObject: ', dateObject);
    let tempTimeseries = this.formatObjectToTimeSeriesData(dateObject);
    this.setState({ timeseries: tempTimeseries });
    if (blocksStartDate.isBefore(moment(this.state.timerange.begin()))) // Shift display if loaded blocks exceed the left of the current timerange.
      this.setState({ timerange: new TimeRange(blocksStartDate.subtract(2, 'days').toDate(), this.state.timerange.end()) })
    return Promise.resolve()
  }

  handleTimerangeChange = (newTr) => {
    this.setState({ timerange: newTr });
    // console.log("New timerange start is: " + newTr.begin());
    // this.setState(prevState => {
    //   prevState.timerange = new TimeRange(newTr.begin(), prevState.timerange.end());
    //   return prevState;
    // }); // Keep end same.
  }

  formatObjectToTimeSeriesData = (hoursObject) => {
    let eventsArr = Object.keys(hoursObject).map(key => {
      // let hourIndex = Index.getIndexString("1h", new Date(parseInt(key) * 1000)) // Pond.js Index format. The hourIndex'th hour since Unix epoch.
      return new IndexedEvent(
        Index.getIndexString(this.state.seeDays ? "1d" : "1h", new Date(parseInt(key) * 1000))
        , hoursObject[key] ? 1 : 0)
    })

    return new TimeSeries({
      name: 'upTime',
      columns: ['time', 'online'],
      events: eventsArr
    })
  }

  /**
   * Function to retireve the validated blocks until it reaches the display start date. Since we iterate over the validated block we need to get them until the displayStartDate or earlier than the displayDtartDate. If for example the last block retrieved was 2 hours before the displayStartDate then we can't know if the validator was validating within those blocks. To ensure we either need to get the blocks in that interval and see it was validating, or get some blocks e.g. 5 hours before which lets us conclide the node was not validating between those 5-2=3 hours. 
   * 
  @returns {Array} array of concatenated validated blocks.
   */
  getBlocksBefore = async () => {
    let tempPage = this.state.page;
    console.log('Raw data is ', this.props.rawData)
    let blocks = this.props.rawData ? this.props.rawData : [];
    let tempBlocks = await getBlocks(this.props.validator, ++tempPage, this.state.offset);
    blocks.push(...tempBlocks);
    this.setState({ page: tempPage });
    return blocks;
  }

  /**
   * @function to a date object with 1 hour interval to be iterated and checked if there exist a validated block in the given interval.
   * 
   * @param {String} startDate 
   * @param {String} endDate 
   * @returns {Object} an object with keys as unix timestamps from startDate to endDate, each 1 hour apart, and values as false. e.g.:
   * 
   * { 1604915869: false ,1605002269: false...}
   * 
   * which would in ISO format be 
   * 
   * { 2020-11-10T09:58:00.000Z: false, 2020-11-11T10:58:00.00Z: false... }
   */
  createHoursObject = (startDate, endDate) => {
    let dateObj = {};
    let currentDate = moment(startDate).startOf('hour').unix();
    let stopDate = moment(endDate).startOf('hour').unix();
    while (currentDate <= stopDate) {
      // for (let i = 0; i < 5; i++) {
      dateObj[currentDate] = false;
      currentDate = moment.unix(currentDate).add(1, 'hours').unix();
    }
    return dateObj;
  }

  createDaysObject = (startDate, endDate) => {
    let dateObj = {};
    let currentDate = moment(startDate).startOf('days').unix();
    console.log('Starting: ', currentDate)
    let stopDate = moment(endDate).startOf('days').unix();
    console.log('Stopping: ', stopDate);
    while (currentDate <= stopDate) {
      // for (let i = 0; i < 5; i++) {
      dateObj[currentDate] = false;
      currentDate = moment.unix(currentDate).add(1, 'days').unix();
    }
    return dateObj;
  }

  /**
   * @function that iterates over the blocks validated by the validator and marks the corresponding entry in the hoursObject true. To do that strips away minutes and seconds from the validated block's timestamp and marks the key in the hoursObject true. Checks if the key is already in the object before to avoid adding entries outside the interval of the hoursObject. 
   * 
   * Does not return anything since hoursObject, as an object, is passed by reference.
   * 
   * @param {Array} blocksArray Array of blocks validated by the validator 
   * @param {Object} hoursObject object created by the @function createHoursObject
   */
  iterateValidatedBlocks = (blocksArray, dateObject) => {
    for (let block of blocksArray) {
      let blockDateISO = block.timeStamp;
      let blockDateWithStartOfUnix = this.state.seeDays ? moment(blockDateISO).startOf('day').unix() : moment(blockDateISO).startOf('hour').unix();
      if (dateObject[blockDateWithStartOfUnix] !== undefined) {
        dateObject[blockDateWithStartOfUnix] = true;
      }
    }
  }

  handleGoBackDisplayDays = () => {
    this.setState({ isLoadingMore: true })
    this.getBlocksBefore()
      .then(this.blocksToTimeseries)
      .then(() => this.setState({ isLoadingMore: false }));
  }

  handleToggleDaysHours = () => {
    this.setState(prevState => ({
      seeDays: !prevState.seeDays
    }), () => this.blocksToTimeseries(this.props.rawData))
  }

  handleMouseOverIndexedEvent = e => {
    let date = moment(e.timestamp());
    let dateStr = this.state.seeDays ? date.format('DD MMM YYYY') : date.format('D MMM YY HH:mm') + date.add(1, 'hour').format('-HH:mm');
    let infoStr = e.get('value') ? 'online' : 'offline';
    this.setState({ hoveredDate: dateStr, hoveredStatus: infoStr })
  };

  render() {
    const withTitle = (children) =>
      <Container fluid>
        <Row>
          <Col className='font-weight-bold'>{this.props.name}</Col>
          <Col className='font-weight-bold text-right'>{this.props.validator}</Col>
        </Row>
        <Row>
          <Col>
            {children}
          </Col>
        </Row>
      </Container>

    if (!this.props.canRender) {
      return "Waiting for the previous graph..."
    }
    if (!this.state.timeseries) {
      return withTitle(
        'Loading data...'
      )
    }

    if (!this.props.validator)
      return withTitle(
        'Loading validators...'
      );

    function styleFunc(event, state) {
      const color = event.get('value') ? 'green' : 'red';
      switch (state) {
        case "normal":
          return {
            fill: color
          };
        case "hover":
          return {
            fill: color,
            opacity: 0.4
          };
        case "selected":
          return {
            fill: color
          };
        default:
        //pass
      }
    }
    return withTitle(
      <Container fluid>
        <Row>
          <ChartContainer
            timeRange={this.state.timerange}
            enablePanZoom={true}
            onTimeRangeChanged={this.handleTimerangeChange}
            format='%d %b'
            width={window.innerWidth}
          >
            <ChartRow height="30" trackerShowTime={true}>
              <Charts>
                <EventChart
                  onMouseOver={this.handleMouseOverIndexedEvent}
                  spacing={0.1}
                  series={this.state.timeseries}
                  size={45}
                  style={styleFunc}
                  hoverMarkerWidth={0}
                />
              </Charts>
            </ChartRow>
          </ChartContainer>
        </Row>
        {this.state.hoveredDate ?
          <Row className='justify-content-center'>
            <span style={{ fontSize: '9pt', color: 'grey' }}>
              Hovered date: {this.state.hoveredDate}   Status: {this.state.hoveredStatus}</span>
          </Row>
          : null
        }

        <Row className='d-flex justify-content-between'>
          <Button size='sm' onClick={this.handleGoBackDisplayDays}>
            {
              this.state.isLoadingMore
                ? <Spinner animation="border" role="status" size='sm' />
                : 'Load Before'
            }
          </Button>
          <Button variant='outline-primary' size='sm' onClick={this.handleToggleDaysHours}>Toggle days/hours</Button>
        </Row>
      </Container>
    )
  }
}