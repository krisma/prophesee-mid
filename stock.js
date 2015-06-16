var mongoose = require('mongoose');
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var stockSchema = new Schema ({
  symbol: String,
  brief: Object,
  detail: Object,
  history: Object,
  last: Date
});

module.exports = mongoose.model('Stock', stockSchema);
