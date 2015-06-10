var mongoose = require('mongoose');

var DeckSchema = new mongoose.Schema({
  deckName: String,
  cards: [{
	  	card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
	  	count: Number
  	}]
});

mongoose.model('Deck', DeckSchema);