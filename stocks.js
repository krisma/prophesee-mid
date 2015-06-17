// var yahooFinance = require('yahoo-finance');
// var http = require('http');
// var mongoose = require('mongoose');
// var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
// var fs = require( 'fs' );
// var csv = require('csv');
var yahooFinance = require('yahoo-finance');
var mongoose = require('mongoose');
var Stock = require('./stock.js');
var async = require('async');
var fs = require('fs');
var csv = require('csv');
var parse = csv.parse;
var moment = require('moment');
// Get brief of stock(as symbol), if it doesn't exist, set one.
var getOrSetBrief = function (symbol, callback) {
	symbol = symbol.replace('-', '^');
	Stock.findOne({ symbol: symbol }, function (err, stock) {
		if (err) return console.error(err);
		if (stock == null) {
			yahooFinance.snapshot({
				symbol: symbol,
				fields: ['p', 'c1', 'p2'],
			}, function (err, snapshot) {
				if (err) return console.error(err);
				callback(snapshot);
				initEach(symbol);
			});
		} else {
			callback(stock.brief);
		};
	});
};

// Get briefs of stocks(as symbols), if they don't exist, set ones.
var getOrSetBriefs = function (symbols, callback) {
	symbol = symbol.replace('-', '^');
	async.map(symbols, 
		getOrSetBrief, 
		function(err, result) {
			if (err) return console.error(err);
			callback(result);
		});
};

// Get detail of stock(as symbol), if it doesn't exist, set one.
var getOrSetDetail = function (symbol, callback) {
	symbol = symbol.replace('-', '^');
	Stock.findOne({ symbol: symbol }, function (err, stock) {
		if (err) return console.error(err);
		if (stock == null) {
			yahooFinance.snapshot({
				symbol: symbol,
				fields: ['m', 'w', 'o', 'v', 'j1', 'r', 'y', 'e7', 's1'],
			}, function (err, snapshot) {
				if (err) return console.error(err);
				callback(snapshot);
				initEach(symbol);
			});
		} else {
			callback(stock.detail);
		};
	});
};

// Get detail of stock(as symbol), if it doesn't exist, set one.
var getOrSetHistory = function (symbol, callback) {
	symbol = symbol.replace('-', '^');
	Stock.findOne({ symbol: symbol }, function (err, stock) {
		if (err) return console.error(err);
		if (stock == null) {
			yahooFinance.historical({
				symbol: symbol,
				fields: ['o', 'p', 'g', 'h'],
			}, function (err, snapshot) {
				if (err) return console.error(err);
				callback(snapshot);
				initEach(symbol);
			});
		} else {
			callback(stock.history);
		};
	});
};




// Initialze all stocks from file(as path), no more than limit iterators will be simultaneously running at any time.
var initAll = function (path, limit) {
	async.waterfall([
		function (callback) {
			var string = '';
			var parser = parse({delimiter: ','});
			var readable = fs.createReadStream(path);
			readable.setEncoding('utf8');
			readable.on('data', function (chunk) {
				string += chunk;
			});
			readable.on('end', function () {
				callback(null, string.split('\n'));
				console.log(string.split('\n'));
			});
		},

		function (symbols, callback) {
			async.eachLimit(symbols, limit,
				initEach,
				function(err) {
					if (err) return console.error(err);
					console.log('Stocks.init - End')
					callback(null);
				});
		}
		])
};
// Initialize one stock(as symbol)
var initEach = function (symbol) {
	symbol = symbol.replace('-', '^');
	Stock.findOne({symbol: symbol}, function (err, stock) {
		if (err) return console.error(err);
		if (stock == null) {
			console.log('initEach - Record not found.');
			async.parallel([
				function (callback) {
					yahooFinance.snapshot({
						symbol: symbol,
						fields: ['p', 'c1', 'p2'],
					}, function (err, snapshot) {
						if (err) return console.error(err);
					// str = str.replace(/"title":/g, '"name":');
					delete snapshot['symbol']
					callback(err, snapshot);
					});
				},
				function (callback) {
					yahooFinance.snapshot({
						symbol: symbol,
						fields: ['m', 'w', 'o', 'v', 'j1', 'r', 'y', 'e7', 's1'],
					}, function (err, snapshot) {
						if (err) return console.error(err);
						delete snapshot['symbol']
						callback(err, snapshot);
					});
				},
				function (callback) {
					yahooFinance.historical({
						symbol: symbol,
						fields: ['o', 'p', 'g', 'h'],
					}, function (err, historical) {
						if (err) return console.error(err);
						async.each(historical,
							function (entry, callback) {
								delete entry['symbol'];
								delete entry['adjClose'];
							},
							function (err, callback) {
								if (err) return console.error(err);
								console.log('deleted');
							});
						callback(err, historical);
					});
				}
				],
				function (err, results) {
					var history = results[2];
					var tmp = new Stock({ symbol: symbol.toUpperCase(), brief: results[0], detail: results[1], history: history, last: history[history.length - 1].date })
					tmp.save(function (err) {
						if (err)
							console.log('unsaved');
					});	
				});
} else {
	console.log('initEach - Exists.');
};
});
};

var updateEach = function(symbol) {
	symbol = symbol.replace('-', '^');
	Stock.findOne({symbol: symbol}, function (err, stock) {
		if (err) return console.error(err);
		if (stock == null) {
			console.log('null');
		} else {
			async.parallel([
				function (callback) {
					yahooFinance.snapshot({
						symbol: symbol,
						fields: ['p', 'c1', 'p2'],
					}, function (err, snapshot) {
						if (err) return console.error(err);
						delete snapshot['symbol']
						callback(err, snapshot);
						});
				},
				function (callback) {
					yahooFinance.snapshot({
						symbol: symbol,
						fields: ['m', 'w', 'o', 'v', 'j1', 'r', 'y', 'e7', 's1'],
					}, function (err, snapshot) {
						if (err) return console.error(err);
						delete snapshot['symbol']
						callback(err, snapshot);
					});
				},
				function (callback) {
					yahooFinance.historical({
						symbol: symbol,
						from: moment(stock.last).add(1, 'days').toDate(),
						to: new Date(),
						fields: ['o', 'p', 'g', 'h'],
					}, 
					function (err, historical) {
						if (err) return console.error(err);
						async.each(historical,
							function (entry, callback) {
								delete entry['symbol'];
								delete entry['adjClose'];
							},
							function (err, callback) {
								if (err) return console.error(err);
							});
						console.log(historical);
						callback(err, historical);
					});
				}], function (err, results) {
					var tmp = stock.history;
					var replace = tmp.concat(results[2]);
					stock.history = replace;
					stock.last = replace[replace.length - 1].date;
					stock.brief = results[0];
					stock.detail = results[1];
					stock.save();
					console.log(stock.last);
					console.log(results);
				});

			};
		});
};





module.exports = {
	getOrSetBrief: getOrSetBrief,
	getOrSetBriefs: getOrSetBriefs,
	getOrSetDetail: getOrSetDetail,
	getOrSetHistory: getOrSetHistory,
	initAll: initAll,
	initEach: initEach,
	updateEach: updateEach,
};

