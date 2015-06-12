var mongoose = require('mongoose');

var DeckSchema = new mongoose.Schema({
  deckName: String,
  faction: String,
  leaderCard: {type:mongoose.Schema.Types.ObjectId, ref: 'LeaderCard'},
  cards: [{
	  	card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
	  	count: Number
  	}]
});

mongoose.model('Deck', DeckSchema);