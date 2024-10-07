// import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/pulse/bootstrap.min.css' // Added this :boom:
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'


fetch("./env.json")
	.then(response => response.json())
	.then(json => {
		window.env = json;

		ReactDOM.render(
		  <React.StrictMode>
			 <App />
		  </React.StrictMode>,
		  document.getElementById('root'),
		)
	});
