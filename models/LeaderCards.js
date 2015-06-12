var mongoose = require('mongoose');

var LeaderCardSchema = new mongoose.Schema({
  cardName: String,
  cardTitle: String,
  faction: String,
  ability: String,
  cardArtImageName: String
});

mongoose.model('LeaderCard', LeaderCardSchema);