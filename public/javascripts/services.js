var app = angular.module('gwentjs.services',[]);
app.factory('cards',['$http', function($http){
    var o = {
        availableCards : [],
        availableLeaderCards: []
    };

    o.getCard = function(id){
      return $http.get('/cards/' + id).then(function(res){
          return res.data;
      })
    };
    o.getLeaderCard = function (id) {
        return $http.get('/leaderCards/' + id).then(function(res){
          return res.data;
      })
    };
    o.getAvailableCards = function(){
        return $http.get('/cards').success(function(data){
            angular.copy(data, o.availableCards);
        });
    };
    o.updateCard = function(card){
        return $http.put('/cards/' + card._id + '/modify', card)
            .success(function(data){
               console.log('updated card ' + data); 
            })
            .error(function(errormessage){
                console.log('screwed up' + errormessage);
            });
    };
    o.updateLeaderCard = function(card){
        return $http.put('/leaderCards/' + card._id + '/modify', card)
            .success(function(data){
               console.log('updated card ' + data); 
            })
            .error(function(errormessage){
                console.log('screwed up' + errormessage);
            });
    };
    o.getAvailableLeaderCards = function () {
        return $http.get('/leaderCards').success(function(data){
            angular.copy(data, o.availableLeaderCards);
        });
    }
    return o;
}]);

app.factory('decks',['$http', function($http){
    var o = {
        deck : []
    };
    o.getDeck = function(id){
        return $http.get('/decks/' + id)
            .then(function(res){
                return res.data;
            });
    }
    o.saveDeck = function(deck){
        return $http.post('/decks', deck).success(function(data){

        });
    }
    return o;
}]);

app.factory('currentDeckFactory', ['decks', function(decks){
    var deck = {
        deckName:'',
        cards:[],
        faction:'',
        leaderCard:{},
        _id:''
    };
    deck.setCards = function(cards){
        deck.cards = cards;
    }
    deck.setName = function(deckName){
        deck.deckName = deckName;
    }
    deck.setFaction = function(faction){
        deck.faction = faction;
    }
    deck.setLeaderCard = function(leaderCard){
        deck.leaderCard = leaderCard;
    }
    deck.setId = function(id){
        deck._id = id;
    }
    deck.getFactionPassive = function(faction){
        if (faction === 'northernrealms') {
                return 'Draw a card from your deck when you win a round.'
            } 
            else if (faction === 'monster'){
                return 'One randomly-chosen Monsters Unit Card stays on the battlefield after each round.'  
            }
            else if (faction === 'scoiatael'){
                return 'You decide who goes first at the start of a battle.'  
            }
            else if (faction === 'nilfgaardian'){
                return 'Win whenever there is a draw.'  
            }
            else {
                return 'This should be populated...';
            }
    }

    return deck;
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};
    auth.getToken = function(){
        return $window.localStorage['flapper-news-token']; 
    };
    auth.saveToken = function(token){
        $window.localStorage['flapper-news-token'] = token;
    };
    auth.isLoggedIn = function(){
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };
    auth.currentUser = function(){
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        };
    };
    auth.register = function(user){
        return $http.post('/register', user).success(function(data){
            auth.saveToken(data.token);
        });
    };
    auth.logIn = function(user){
        return $http.post('/login', user).success(function(data){
            auth.saveToken(data.token);
        });
    };
    auth.logOut = function(){
        $window.localStorage.removeItem('flapper-news-token');
    };
    return auth;
}]);