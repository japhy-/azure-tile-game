import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// import App from './App2-Chat';
// import App from './App3-Chat'
// import App from './App4-Slots'
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
