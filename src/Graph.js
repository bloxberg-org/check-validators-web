import moment from 'moment'
import { Index, IndexedEvent, TimeRange, TimeSeries } from 'pondjs'
import React from 'react'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import {
  ChartContainer,
  ChartRow,
  Charts,
  EventChart,
} from 'react-timeseries-charts'
import { getBlocks } from './utils'

export default class Graph extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoadingMore: false,
      timeseries: null,
      timerange: new TimeRange(moment.utc().subtract(7, 'days'), moment.utc()), // pond.js Timerange to be shown by the graph
      page: 0, // blockexplorer query page default
      offset: 10000, // blockexplorer query offset default
      seeDays: true, // days/hours toggle. Default show days.
    }
  }

  componentDidMount() {
    if (!this.props.canRender) return // Do nothing if can't render yet.
    if (this.props.rawData) {
      this.props.nextCanRender()
      this.blocksToTimeseries(this.props.rawData) // Format and render rawData
    } else {
      this.getBlocksBefore()
        .then(this.blocksToTimeseries) // Fetch blocks, format adn render fetched raw data.
        .then(this.props.nextCanRender)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.canRender && !prevProps.canRender) {
      console.log('Now ' + this.props.validator + ' can update!')
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

  /**
   * Function to format raw blocks from blockexplorer into time series data.
   *
   * Saves the raw data to App.js's blockData through props.setRawData.
   *
   * @param {Array} blocks
   */
  blocksToTimeseries = (blocks) => {
    let blocksStartDate = moment.utc(blocks[blocks.length - 1].timeStamp) // Date of the earliest block.
    console.log('Existing earliest block is at: ', blocksStartDate.format())
    this.props.setRawData(blocks) // Set raw data for current address. See passed setRawData in GraphPage.

    let dateObject
    console.log('seeDays is ', this.state.seeDays)
    if (this.state.seeDays)
      // Display days.
      dateObject = this.createDaysObject(
        blocksStartDate,
        this.state.displayEndDate,
      )
    // Display hours.
    else
      dateObject = this.createHoursObject(
        blocksStartDate,
        this.state.displayEndDate,
      )
    this.iterateValidatedBlocks(blocks, dateObject)
    console.log('Iterated dateObject: ', dateObject)
    // format into pond.js TimeSeries to plot the graph.
    let tempTimeseries = this.formatObjectToTimeSeriesData(dateObject)
    this.setState({ timeseries: tempTimeseries }) // render the timeseries data.

    // Shift display if newly fetched blocks exceed the leftmost date of the current timerange on the graph.
    if (blocksStartDate.isBefore(moment.utc(this.state.timerange.begin()))) {
      this.setState({
        timerange: new TimeRange(
          blocksStartDate.subtract(2, 'days').toDate(),
          this.state.timerange.end(),
        ),
      })
    }

    return Promise.resolve()
  }

  handleTimerangeChange = (newTr) => {
    this.setState({ timerange: newTr })
  }

  /**
   * Function to format dateObject into pondjs IndexedEvent data which specifies events over a time range.
   * See https://esnet-pondjs.appspot.com/#/indexedevent
   *
   * @param {dateObject} See createHoursObject/createDaysObject
   * @returns {TimeSeries} formatted pond.js TimeSeries data. see https://esnet-pondjs.appspot.com/#/timeseries
   */
  formatObjectToTimeSeriesData = (dateObject) => {
    let eventsArr = Object.keys(dateObject).map((key) => {
      // each key as timestamp.
      // e.g. IndexedEvent(1d-1565, 1) 1d-1565 is the entire duration of the 1565th day since the UNIX epoch, value of the event is 1.
      return new IndexedEvent(
        Index.getIndexString(
          // supply an index string see https://esnet-pondjs.appspot.com/#/index
          this.state.seeDays ? '1d' : '1h',
          new Date(parseInt(key) * 1000), // unix timestamp in ms.
        ),
        dateObject[key] ? 1 : 0,
      )
    })

    return new TimeSeries({
      name: 'upTime',
      columns: ['time', 'online'],
      events: eventsArr,
    })
  }

  /**
   * Function to retireve the validated blocks for the next page.
   *
   * @returns {Array} array of concatenated validated blocks.
   */
  getBlocksBefore = async () => {
    let tempPage = this.state.page
    console.log('Raw data is ', this.props.rawData)
    let blocks = this.props.rawData ? this.props.rawData : []
    let tempBlocks = await getBlocks(
      this.props.validator,
      ++tempPage,
      this.state.offset,
    )
    blocks.push(...tempBlocks)
    this.setState({ page: tempPage })
    return blocks
  }

  /**
   * @function createHoursObject to create a date object with keys as timestamps each 1 hour apart
   * from startDate until endDate. Values are bool values, set to false. Object returned from this
   * function will be iterated to mark true/false if there exists a block within this interval.
   *
   * @param {String} startDate
   * @param {String} endDate
   * @returns {Object} an object with keys as unix timestamps from startDate to endDate, each 1 hour apart, and values as false.
   *
   * @example
   * returns
   * { 1604915869: false ,1605002269: false...}
   *
   * which would in ISO format be
   *
   * { 2020-11-10T09:58:00.000Z: false, 2020-11-11T10:58:00.00Z: false... }
   */
  createHoursObject = (startDate, endDate) => {
    let dateObj = {}
    let currentDate = moment.utc(startDate).startOf('hour').unix()
    let stopDate = moment.utc(endDate).startOf('hour').unix()
    while (currentDate <= stopDate) {
      // for (let i = 0; i < 5; i++) {
      dateObj[currentDate] = false
      currentDate = moment.unix(currentDate).utc().add(1, 'hours').unix()
    }
    return dateObj
  }

  // See createHoursObject.
  createDaysObject = (startDate, endDate) => {
    let dateObj = {}
    let currentDate = moment.utc(startDate).startOf('days').unix()
    console.log('Starting: ', currentDate)
    let stopDate = moment.utc(endDate).startOf('days').unix()
    console.log('Stopping: ', stopDate)
    while (currentDate <= stopDate) {
      // for (let i = 0; i < 5; i++) {
      dateObj[currentDate] = false
      currentDate = moment.unix(currentDate).utc().add(1, 'days').unix()
    }
    return dateObj
  }

  /**
   * @function iterateValidatedBlocks that iterates over the blocks fetched from the blockexplorer and marks the corresponding time intervals in the dateObject true.
   *
   * To do that strips away minutes and seconds (and hours if seeDays === true) from the
   * validated block's timestamp and marks the key in the dateObject true.
   *
   * Marks only the keys that already exist in the dateObject true to avoid creating new
   * keys outside the dateObject interval.
   *
   * Does not return anything since dateObject, as an object, is passed by reference.
   *
   * @param {Array} blocksArray Array of blocks validated by the validator from the blockexplorer.
   * @param {Object} dateObject object created by the createHoursObject or createDaysObject
   */
  iterateValidatedBlocks = (blocksArray, dateObject) => {
    for (let block of blocksArray) {
      let blockDateISO = block.timeStamp
      let blockDateWithStartOfUnix = this.state.seeDays
        ? moment.utc(blockDateISO).startOf('day').unix()
        : moment.utc(blockDateISO).startOf('hour').unix()
      if (dateObject[blockDateWithStartOfUnix] !== undefined) {
        dateObject[blockDateWithStartOfUnix] = true
      }
    }
  }

  loadBefore = () => {
    this.setState({ isLoadingMore: true })
    this.getBlocksBefore()
      .then(this.blocksToTimeseries)
      .then(() => this.setState({ isLoadingMore: false }))
  }

  handleToggleDaysHours = () => {
    this.setState(
      (prevState) => ({
        seeDays: !prevState.seeDays,
      }),
      () => this.blocksToTimeseries(this.props.rawData),
    )
  }

  handleMouseOverIndexedEvent = (e) => {
    let date = moment.utc(e.timestamp())
    let dateStr = this.state.seeDays
      ? date.format('DD MMM YYYY')
      : date.format('D MMM YY HH:mm') + date.add(1, 'hour').format('-HH:mm')
    let infoStr = e.get('value') ? 'online' : 'offline'
    this.setState({ hoveredDate: dateStr + ' UTC', hoveredStatus: infoStr })
  }

  render() {
    // To add title to each Graph.
    const withTitle = (children) => (
      <Container fluid>
        <Row>
          <Col className="font-weight-bold">{this.props.name}</Col>
          <Col className="font-weight-bold text-right">
            {this.props.validator}
          </Col>
        </Row>
        <Row>
          <Col>{children}</Col>
        </Row>
      </Container>
    )

    if (!this.props.canRender) {
      return 'Waiting for the previous graph...'
    }
    if (!this.state.timeseries) {
      return withTitle('Loading data...')
    }

    if (!this.props.validator) return withTitle('Loading validators...')

    // Style function for the EventChart
    function styleFunc(event, state) {
      const color = event.get('value') ? '#2dcf96' : '#ff4848'
      switch (state) {
        case 'normal':
          return {
            fill: color,
          }
        case 'hover':
          return {
            fill: color,
            opacity: 0.4,
          }
        case 'selected':
          return {
            fill: color,
          }
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
            format="%d %b"
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
        {this.state.hoveredDate ? (
          <Row className="justify-content-center">
            <span style={{ fontSize: '9pt', color: 'grey' }}>
              Hovered date: {this.state.hoveredDate} Status:{' '}
              {this.state.hoveredStatus}
            </span>
          </Row>
        ) : null}

        <Row className="d-flex justify-content-between">
          <Button
            size="sm"
            style={{ backgroundColor: '#1c2b36', borderColor: '#1c2b36' }}
            onClick={this.loadBefore}
          >
            {this.state.isLoadingMore ? (
              <Spinner animation="border" role="status" size="sm" />
            ) : (
              'Load Before'
            )}
          </Button>
          <Button
            style={{ backgroundColor: '#1c2b36', borderColor: '#1c2b36' }}
            size="sm"
            onClick={this.handleToggleDaysHours}
          >
            Toggle days/hours
          </Button>
        </Row>
      </Container>,
    )
  }
}
