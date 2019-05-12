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
  let pair;

  if(coin=='BTC'){
    pair = coin+"/USDT";
  } else{
    pair = coin+"/BTC";
  }

  const query = "SELECT coinData.*,TRUNCATE((((coinData.price - coinData.foundPrice) / coinData.foundPrice) * 100),2) AS pctg,DATE_FORMAT(coinData.foundTime, '%Y-%m-%d %H:%i') AS foundTime,coins.coin FROM coinData INNER JOIN coins ON SUBSTRING_INDEX(coinData.pair, '/', 1) = coins.ticker WHERE pair = ? AND exchange = ? ORDER BY timeFrame"
  pool.query(query, [pair,exchange], (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message, }
      res.send(response)
    }

    const zobot_results_1d = results[0]
    const zobot_results_1h = results[1]

    let pre_symbol_1d;
    let pre_symbol_1h;

    let pre_price = "";
    if(coin=='BTC'){
      pre_price = "$";
    }

    let pctg_1d = zobot_results_1d.pctg;
    let pctg_1h = zobot_results_1h.pctg;

    if(pctg_1d>0){
      pre_symbol_1d = "▲";
    } else if (pctg_1d<0){
      pre_symbol_1d = "▼";
    } else if (pctg_1d == 0){
      pre_symbol_1d = "=";
    }

    if(pctg_1h>0){
      pre_symbol_1h = "▲";
    } else if (pctg_1h<0){
      pre_symbol_1h = "▼";
    } else if (pctg_1h == 0){
      pre_symbol_1h = "=";
    }

    const response = {
      data: results,
      message: "<b>" + pair + "</b>" +
      "\n 1d: " + zobot_results_1d.coinStatus +
      "\n Price: " + pre_price + zobot_results_1d.price +
      "\n Found price: " + pre_price + zobot_results_1d.foundPrice +
      "\n Found time: " + zobot_results_1d.foundTime +
      "\n Change: " + pre_symbol_1d +  " " + zobot_results_1d.pctg + "%" +
      //"\n Details: <a href='https://app.buenavistacryptoclub.com/zobot_coin_detail.html?c=" + coin + "&t=1d&exchange=" + exchange + "'>Click here</a>" +

      "\n \n 1hr: " + zobot_results_1h.coinStatus +
      "\n price: " + pre_price + zobot_results_1h.price +
      "\n found price: " + pre_price + zobot_results_1h.foundPrice +
      "\n found time: " + zobot_results_1h.foundTime +
      "\n change: " + pre_symbol_1h +  " " + zobot_results_1h.pctg + "%",
      //"\n Details: <a href='https://app.buenavistacryptoclub.com/zobot_coin_detail.html?c="+ coin +"&t=1hr&exchange=" + exchange + "'>Click here</a>",
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
