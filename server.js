var http = require('http');
var mongoose = require('mongoose');
var Schema = mongoose.Schema
, ObjectId = Schema.ObjectId;
var Stock = require('./stock.js');
var Stocks = require('./stocks.js');
var yahooFinance = require('yahoo-finance');

var express = require('express');
var app = express();
var async = require('async');
var moment = require('moment');
var fs = require('fs');
var parse = require('csv').parse;
mongoose.connect('mongodb://localhost:5000/');
//mongoose.connect('mongodb://krisma:success@ds045511.mongolab.com:45511/heroku_z67qmbpr');




app.get('/getBrief/:symbol', function (req, res) {
	Stocks.getOrSetBrief(req.params.symbol, function (rtn) {
		res.send(rtn);
	});
});
app.get('/getBriefs/:symbols', function (req, res) {
	Stocks.getOrSetBriefs(req.params.symbols, function (rtn) {
		res.send(rtn);
	});
});
app.get('/getDetail/:symbol', function (req, res) {
	Stocks.getOrSetDetail(req.params.symbol, function (rtn) {
		res.send(rtn);
	});
});
app.get('/getHistory/:symbol', function (req, res) {
	Stocks.getOrSetHistory(req.params.symbol, function (rtn) {
		res.send(rtn);
	});
});
app.get('/initAll', function (req, res) {
	Stocks.initAll(req.params.path, 5);
});
app.get('/initEach', function (req, res) {
	Stocks.initEach(req.params.symbol);
});
app.get('/updateEach/:symbol', function (req, res) {
	Stocks.updateEach(req.params.symbol);
});





var server = app.listen(process.env.PORT || 8080, function () {

	var host = server.address().address;
	var port = server.address().port;


	console.log('Prophesee server app listening at http://%s:%s', host, port);

});