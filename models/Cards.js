var mongoose = require('mongoose');

var CardSchema = new mongoose.Schema({
  cardName: String,
  cardDescription: String,
  cardArtImageName: String,
  range: Array,
  type: Array,
  strength: Number,
  shiny: Boolean,
  special: Boolean,
  weather: Boolean,
  faction: String
});

mongoose.model('Card', CardSchema);