"use strict";
require('dotenv').config();

const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const pool = require('./lib/api/mysql')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Handle calls GET route - returns detail on a specific call
app.get('/zobot_status/:exchange/:coin', (req, res) => {
  const exchange = req.params.exchange
  const coin = req.params.coin.toUpperCase();
  console.log("coin="+coin);
  let pair;
  if(coin=='BTC'){
    pair = coin+"/USDT";
  } else{
    pair = coin+"/BTC";
  }
  console.log(exchange + " " + pair);
  const query = `SELECT ID,pair,exchange,coinStatus,price,timeFrame FROM coinData WHERE pair = '${pair}' AND exchange = '${exchange}' ORDER BY timeFrame`;
  console.log(query);
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message, }
      res.send(response)
    }
    console.log(results);
    const zobot_results_1d = results[0]
    const zobot_results_1h = results[1]
    const response = {
      data: results,
      message: pair + " status: \n 1d: " + zobot_results_1d.coinStatus + " \n 1hr: " + zobot_results_1h.coinStatus,
    }
    res.status(200).send(response)
  })
})

// Handle in-valid route
app.all('*', function(req, res) {
  const response = { data: null, message: 'Route not found!!' }
  res.status(400).send(response)
})

// wrap express app instance with serverless http function
module.exports.zobot_status = serverless(app)
