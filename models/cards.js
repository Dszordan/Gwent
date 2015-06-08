var mongoose = require('mongoose');

var CardSchema = new mongoose.Schema({
  cardName: String,
  cardDescription: String,
  cardArtImageName: String,
  range: Array,
  type: String,
  strength: Number,
  shiny: Boolean
});

mongoose.model('Card', CardSchema);