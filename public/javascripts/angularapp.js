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
            if (deck) {
                $scope.deckName = deck.deckName;
                for (var i = 0; i < deck.cards.length; i++) {
                    var deck_id = deck.cards[i].card._id;
                    for (var j = 0; j < $scope.availableCards.length; j++) {
                        if ($scope.availableCards[j]._id == deck_id) {
                            var count = deck.cards[i].count;
                            $scope.putCardInDeck($scope.availableCards[j], count);
                        };
                    };
                };
            };
        });
        $scope.availableCards = cards.availableCards;
        $scope.availableCardsFilter = $scope.availableCards;
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
                cards: $scope.currentDeck
            };
            decks.saveDeck(deckToSave).success(function(data){
                $scope.savedURL = "http://localhost:3000/#/decks/" + data._id;
                $scope.saveResultMessage = "saved " + $scope.savedURL ;
            });
        };
        $scope.refreshCurrentDeckFilter();
        $scope.calculateTotals();
    }]);

app.factory('cards',['$http', function($http){
    var o = {
        availableCards : []
    };

    o.getCard = function(id){
      return $http.get('/cards/' + id).then(function(res){
          return res.data;
      })
    };
    o.getAvailableCards = function(){
        return $http.get('/cards').success(function(data){
            angular.copy(data, o.availableCards);
        });
    };
    o.updateCard = function(card){
        console.log('card : ' + card)
        return $http.put('/cards/' + card._id + '/modify', card)
            .success(function(data){
               console.log('updated card ' + data); 
            })
            .error(function(errormessage){
                console.log('screwed up' + errormessage);
            });
    };
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