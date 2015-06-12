var app = angular.module('gwentjs',['ui.router']);

app.controller("MainCtrl",[
    '$scope',
    'posts',
    'auth',
     function($scope, posts, auth){
    $scope.test = 'hello world';
    $scope.posts = posts.posts;
    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.addPost = function(){
        if (!$scope.title || $scope.title === '' ) {return;};
        posts.create({
            title:$scope.title,
            link:$scope.link
        });
        $scope.title = '';
        $scope.link = '';
    };

    $scope.incrementUpvotes = function(post){
        posts.upvote(post);
    };
    $scope.decrementUpvotes = function(post){
        posts.downvote(post);
    };
}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth){
    $scope.user = {};

    $scope.register = function(){
        auth.register($scope.user).error(function(error){
            $scope.error = error;
        }).then(function(){
            $state.go('home');
        });
    };

    $scope.logIn = function(){
        auth.logIn($scope.user).error(function(error){
            $scope.error = error;
        }).then(function(){
            $state.go('home');
        });
    };
}]);

app.controller('NavCtrl',
    ['$scope',
    'auth',
    function($scope, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }]);

app.controller('cardsCtrl',
    ['$scope',
    'cards',
    function($scope,cards){
        cards.getAvailableCards();
        $scope.availableCards = cards.availableCards;
    }]);

app.controller('leaderCardsCtrl',
    ['$scope',
    'cards',
    function($scope,cards){
        cards.getAvailableLeaderCards();
        $scope.availableCards = cards.availableLeaderCards;
    }]);

app.controller('cardModifyCtrl',
    ['$scope',
    'cards',
    'card',
    function($scope, cards, card){
        $scope.card = card;
        $scope.modifyCard = function(){
            cards.updateCard(card);
        };
    }]);

app.controller('leaderCardModifyCtrl',
    ['$scope',
    'cards',
    'card',
    function($scope, cards, card){
        $scope.card = card;
        $scope.modifyCard = function(){
            cards.updateLeaderCard(card);
        };
    }]);

app.controller('creditsCtrl',
    ['$scope',
    function($scope){
    }]);

app.controller('deckBuilderCtrl',
    ['$scope',
    'cards',
    'decks',
    'deck',
    function($scope,cards,decks,deck){
        cards.getAvailableCards()
            .success(function(data){
            $scope.availableCardsSuperset = data;
            if (deck) {
                $scope.loadExistingDeck(deck);
            } else {
                $scope.filterAvailableCards("northernrealms");
            }
        });
        cards.getAvailableLeaderCards()
            .success(function(data){
                $scope.availableLeaderCardsSuperset = data;
                if (deck) {
                    $scope.filterAvailableLeaderCards(deck.faction);
                    $scope.changeLeaderCard(deck.leaderCard);
                } else {
                    $scope.filterAvailableLeaderCards("northernrealms");
                }
        });
        $scope.availableLeaderCardsSuperset = {};
        $scope.currentLeaderCard = {};
        $scope.leaderCardsFilter = [];
        $scope.selectedFaction = "";
        $scope.currentDeck = [];
        $scope.currentDeckFilter = [];
        $scope.deckName = "";
        $scope.currentDeckFilterName = "all";
        $scope.availableCardsFilterDisplayName = "All Cards";
        $scope.currentDeckFilterDisplayName = "All Cards";
        $scope.totalCards = 0;
        $scope.totalUnitCards = 0;
        $scope.totalSpecialCards = 0;
        $scope.totalUnitStrength = 0;
        $scope.totalHeroCards = 0;
        $scope.savedURL = '';
        $scope.saveResultMessage = '';
        $scope.filterAvailableCards = function(faction){
            if (faction === $scope.selectedFaction) {return;};
            $scope.selectedFaction = faction;
            $scope.setFaction(faction);
            var cardSubset = [];
            $scope.currentDeck = [];
            $scope.currentDeckFilter = [];
            for (var i = 0; i < $scope.availableCardsSuperset.length; i++) {
                if ($scope.availableCardsSuperset[i].faction === faction || $scope.availableCardsSuperset[i].faction === 'neutral') {
                    cardSubset.push($scope.availableCardsSuperset[i]);
                };
            };
            $scope.availableCards = cardSubset;
            $scope.availableCardsFilter = cardSubset;
            $scope.calculateTotals();
        };
        $scope.filterAvailableLeaderCards = function (faction) {
            $scope.leaderCardsFilter = [];
            for (var i = 0; i < $scope.availableLeaderCardsSuperset.length; i++) {
                if($scope.availableLeaderCardsSuperset[i].faction === faction)
                    $scope.leaderCardsFilter.push($scope.availableLeaderCardsSuperset[i]);
            };
            $scope.currentLeaderCard = $scope.leaderCardsFilter[0];
        }
        $scope.setFaction = function(faction){
            if (faction === 'northernrealms') {
                $scope.factionDisplayName = 'Northern Realms';
                $scope.factionPassive = 'Draw a card from your deck when you win a round.'
                $scope.factionImage = "/images/northernrealms.png"
            } 
            else if (faction === 'monster'){
                $scope.factionDisplayName = 'Monster';
                $scope.factionPassive = 'One randomly-chosen Monsters Unit Card stays on the battlefield after each round.'  
                $scope.factionImage = "/images/monster.png"
            }
            else if (faction === 'scoiatael'){
                $scope.factionDisplayName = 'Scoia\'tael';
                $scope.factionPassive = 'You decide who goes first at the start of a battle.'  
                $scope.factionImage = "/images/scoiatael.png"
            }
            else if (faction === 'nilfgaardian'){
                $scope.factionDisplayName = 'Nilfgaardian Empire';
                $scope.factionPassive = 'Win whenever there is a draw.'  
                $scope.factionImage = "/images/nilfgaard.png"
            }
            else {
                $scope.factionDisplayName = 'This should be populated...';
                $scope.factionPassive = 'This should be populated...';
            }
            $scope.filterAvailableLeaderCards(faction);
        }
        $scope.changeLeaderCard = function(leaderCard){
            for (var i = 0; i < $scope.availableLeaderCardsSuperset.length; i++) {
                if ($scope.availableLeaderCardsSuperset[i]._id === leaderCard._id) {
                    $scope.currentLeaderCard = $scope.availableLeaderCardsSuperset[i];
                    break;
                };
            };
        }
        $scope.loadExistingDeck = function(deck){
            $scope.deckName = deck.deckName;
            $scope.filterAvailableCards(deck.faction);
            for (var i = 0; i < deck.cards.length; i++) {
                var deck_id = deck.cards[i].card._id;
                for (var j = 0; j < $scope.availableCards.length; j++) {
                    if ($scope.availableCards[j]._id == deck_id) {
                        var count = deck.cards[i].count;
                        $scope.putCardInDeck($scope.availableCards[j], count);
                    };
                };
            };
        }
        $scope.putCardInDeck = function(card,count){
            var cardFoundInDeck = false;
            for (var i = 0; i < $scope.currentDeck.length; i++) {
                var cardInDeck = $scope.currentDeck[i];
                if (cardInDeck.card === card) {
                    cardInDeck.count+=count;
                    cardFoundInDeck = true;
                    break;
                };
            };
            if ($scope.currentDeck.length == 0 || !cardFoundInDeck) {
                $scope.currentDeck.push({'card':card, 'count': count});
            };
            this.calculateTotals();
            $scope.refreshCurrentDeckFilter();
        };
        $scope.removeCardFromDeck = function(card){
            var cardFoundInDeck = false;
            for (var i = 0; i < $scope.currentDeck.length; i++) {
                var cardInDeck = $scope.currentDeck[i];
                if (cardInDeck.card === card) {
                    cardInDeck.count--;
                    if (cardInDeck.count == 0) {
                        $scope.currentDeck.splice(i, 1);
                        for (var j = 0; j < $scope.currentDeckFilter.length; j++) {
                            if ($scope.currentDeckFilter[j].card === card) {$scope.currentDeckFilter.splice(j, 1);};
                        };
                    };
                    break;
                };
            };
            this.calculateTotals();
        };
        $scope.switchAvailableCardsFilter = function(newType, newFilter){
            if (newType == "predefined") {
                $scope.availableCardsFilterDisplayName = newFilter[0].toUpperCase() + newFilter.substring(1, newFilter.length) + " Cards";
                if (newFilter=="all") {
                    $scope.availableCardsFilter = $scope.availableCards;
                } else if (newFilter == "melee" || newFilter == "ranged" || newFilter=="siege"){
                    $scope.availableCardsFilter = [];
                    for (var i = 0; i < $scope.availableCards.length; i++) {
                        if($scope.availableCards[i].range.indexOf(newFilter) != -1)
                            $scope.availableCardsFilter.push($scope.availableCards[i]);
                    };
                } else if (newFilter == "hero"){
                    $scope.availableCardsFilter = [];
                    for (var i = 0; i < $scope.availableCards.length; i++) {
                        if($scope.availableCards[i].shiny)
                            $scope.availableCardsFilter.push($scope.availableCards[i]);
                    };
                } else if (newFilter == "weather"){
                    $scope.availableCardsFilter = [];
                    for (var i = 0; i < $scope.availableCards.length; i++) {
                        if($scope.availableCards[i].weather)
                            $scope.availableCardsFilter.push($scope.availableCards[i]);
                    };
                } else if (newFilter == "special"){
                    $scope.availableCardsFilter = [];
                    for (var i = 0; i < $scope.availableCards.length; i++) {
                        if($scope.availableCards[i].special)
                            $scope.availableCardsFilter.push($scope.availableCards[i]);
                    };
                }
            };
        };
        $scope.switchCurrentCardsFilter = function(newType, newFilter){
            $scope.currentDeckFilterName = newFilter;
            if (newType == "predefined") {
                $scope.refreshCurrentDeckFilter();
            };
        };
        $scope.refreshCurrentDeckFilter = function(){
            var newFilter = $scope.currentDeckFilterName;
            $scope.currentDeckFilterDisplayName = newFilter[0].toUpperCase() + newFilter.substring(1, newFilter.length) + " Cards";
                if (newFilter=="all") {
                    $scope.currentDeckFilter = $scope.currentDeck;
                } else if (newFilter == "melee" || newFilter == "ranged" || newFilter=="siege"){
                    $scope.currentDeckFilter = [];
                    for (var i = 0; i < $scope.currentDeck.length; i++) {
                        if($scope.currentDeck[i].card.range.indexOf(newFilter) != -1)
                            $scope.currentDeckFilter.push($scope.currentDeck[i]);
                    };
                } else if (newFilter == "hero"){
                    $scope.currentDeckFilter = [];
                    for (var i = 0; i < $scope.currentDeck.length; i++) {
                        if($scope.currentDeck[i].card.shiny)
                            $scope.currentDeckFilter.push($scope.currentDeck[i]);
                    };
                } else if (newFilter == "weather"){
                    $scope.currentDeckFilter = [];
                    for (var i = 0; i < $scope.currentDeck.length; i++) {
                        if($scope.currentDeck[i].card.weather)
                            $scope.currentDeckFilter.push($scope.currentDeck[i]);
                    };
                } else if (newFilter == "special"){
                    $scope.currentDeckFilter = [];
                    for (var i = 0; i < $scope.currentDeck.length; i++) {
                        if($scope.currentDeck[i].card.special)
                            $scope.currentDeckFilter.push($scope.currentDeck[i]);
                    };
                }
        }
        $scope.calculateTotals = function(){
            var totalHeroCards = 0;
            var totalCards = 0;
            var totalUnitStrength = 0;
            var totalSpecialCards = 0;
            var totalUnitCards = 0;
            var unitCount = 0;
            for (var i = 0; i < $scope.currentDeck.length; i++) {
                var card = $scope.currentDeck[i].card;
                var count = $scope.currentDeck[i].count;
                if (card.type.indexOf("unit") != -1){
                    unitCount += count;
                }
                if (card.shiny)
                    totalHeroCards+= count;
                if (card.special)
                    totalSpecialCards += count;
                totalUnitStrength+=card.strength * count;
                totalUnitCards = unitCount;
                totalCards+= count;
            };

            $scope.totalCards = totalCards;
            $scope.totalUnitCards = totalUnitCards;
            $scope.totalSpecialCards = totalSpecialCards;
            $scope.totalUnitStrength = totalUnitStrength;
            $scope.totalHeroCards = totalHeroCards;
        };
        $scope.saveDeck = function(){
            var deckToSave ={
                deckName:$scope.deckName,
                cards: $scope.currentDeck,
                faction: $scope.selectedFaction,
                leaderCard : $scope.currentLeaderCard
            };
            decks.saveDeck(deckToSave).success(function(data){
                $scope.savedURL = "http://localhost/#/decks/" + data._id;
                $scope.saveResultMessage = "Deck Saved";
            });
        };
        $scope.refreshCurrentDeckFilter();
        $scope.calculateTotals();
    }]);

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
        return $http.get('/decks/' + id).then(function(res){
            return res.data;
        });
    }
    o.saveDeck = function(deck){
        return $http.post('/decks', deck).success(function(data){

        });
    }
    return o;
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

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider){
          $stateProvider
            .state('home', {
              url: '/home',
              templateUrl: '/templates/deckBuilder.html',
              controller: 'deckBuilderCtrl',
              resolve:{
                deck: ['$stateParams', 'decks', function($stateParams, decks){
                          return '';
                      }]
              }
            })
            .state('loadDeck',{
                  url:'/decks/{id}',
                  templateUrl: '/templates/deckBuilder.html',
                  controller: 'deckBuilderCtrl',
                  resolve: {
                      deck: ['$stateParams', 'decks', function($stateParams, decks){
                          return decks.getDeck($stateParams.id);
                      }]
                  }
              })
            .state('modifyCard',{
                  url:'/cards/{id}',
                  templateUrl: '/templates/modifyCard.html',
                  controller: 'cardModifyCtrl',
                  resolve: {
                      card: ['$stateParams', 'cards', function($stateParams, cards){
                          return cards.getCard($stateParams.id);
                      }]
                  }
              })
            .state('modifyLeaderCard',{
                  url:'/leaderCards/{id}',
                  templateUrl: '/templates/modifyLeaderCard.html',
                  controller: 'leaderCardModifyCtrl',
                  resolve: {
                      card: ['$stateParams', 'cards', function($stateParams, cards){
                          return cards.getLeaderCard($stateParams.id);
                      }]
                  }
              })
            .state('viewLeaderCards',{
                  url:'/leaderCards',
                  templateUrl: '/templates/allLeaderCards.html',
                  controller: 'leaderCardsCtrl'
              })
            .state('viewCards',{
                  url:'/cards',
                  templateUrl: '/templates/allCards.html',
                  controller: 'cardsCtrl'
              })
            .state('login', {
                url: '/login',
                templateUrl: '/templates/login.html',
                controller: 'AuthCtrl',
                onEnter: [ '$state', 'auth', function($state, auth){
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    };
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: '/templates/register.html',
                controller: 'AuthCtrl',
                onEnter: [ '$state', 'auth', function($state, auth){
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    };
                }]
            }).state('credits',{
                url:'/credits',
                templateUrl:'/templates/credits.html',
                controller:'creditsCtrl'
            });

        $urlRouterProvider.otherwise('home');
    }]);