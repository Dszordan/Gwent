var app = angular.module('gwentjs',['ui.router','infinite-scroll','gwentjs.configuration','gwentjs.services']);
/* 
    Controller for dealing with authentication the user
*/
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

/* 
    Controller for the navigation bar at the top of the screen
*/
app.controller('NavCtrl',
    ['$scope',
    'auth',
    function($scope, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }]);

/*
    Controller for displaying all available cards for later modification
*/
app.controller('cardsCtrl',
    ['$scope',
    'cards',
    function($scope,cards){
        cards.getAvailableCards();
        $scope.availableCards = cards.availableCards;
    }]);

/*
    Controller for displaying all leader cards for later modification
*/
app.controller('leaderCardsCtrl',
    ['$scope',
    'cards',
    function($scope,cards){
        cards.getAvailableLeaderCards();
        $scope.availableCards = cards.availableLeaderCards;
    }]);

/*
    Controller to modify an individual card (non leader card)
*/
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

/*
  Controller to modify an individual leader card 
*/
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

/*
    Controller to display the credits page... could prob do without a controller.
*/
app.controller('creditsCtrl',
    ['$scope',
    function($scope){
    }]);

/*
    This presents 4 leader cards depending on the faction selected. Also presents 4 buttons to switch the current faction
    Primary functions - 
    changing the selected faction, 
    changing the leader cards presented, 
    changing the leader card selected
*/
app.controller('leaderSelectionCtrl',
    ['$scope',
    '$rootScope',
    'cards',
    'currentDeckFactory',
    'existingDeck',
    function($scope,$rootScope, cards, currentDeckFactory, existingDeck){
        $scope.availableLeaderCardsSuperset = {};
        $scope.currentLeaderCard = {};
        $scope.leaderCardsFilter = [];
        $scope.selectedFaction = "";
        cards.getAvailableLeaderCards()
            .success(function(data){
                $scope.availableLeaderCardsSuperset = data;
                if (existingDeck) {
                    $scope.changeFaction(existingDeck.faction);
                    $scope.changeLeaderCard(existingDeck.leaderCard);
                    $scope.setFactionDisplay(existingDeck.faction);
                } else {
                    $scope.setFactionDisplay("northernrealms");
                    $scope.changeFaction("northernrealms");
                }
        });
        $scope.changeFaction = function (faction) {
            var oldAndNewFaction = {oldFaction: $scope.selectedFaction, newFaction:faction};
            $scope.leaderCardsFilter = [];
            $scope.setFactionDisplay(faction);
            for (var i = 0; i < $scope.availableLeaderCardsSuperset.length; i++) {
                if($scope.availableLeaderCardsSuperset[i].faction === faction)
                    $scope.leaderCardsFilter.push($scope.availableLeaderCardsSuperset[i]);
            };
            $scope.currentLeaderCard = $scope.leaderCardsFilter[0];
            $rootScope.$broadcast('factionChanged', oldAndNewFaction);
            currentDeckFactory.setFaction(faction);
        }
        $scope.changeLeaderCard = function(leaderCard){
            for (var i = 0; i < $scope.availableLeaderCardsSuperset.length; i++) {
                if ($scope.availableLeaderCardsSuperset[i]._id === leaderCard._id) {
                    $scope.currentLeaderCard = $scope.availableLeaderCardsSuperset[i];
                    break;
                };
            };
            currentDeckFactory.setLeaderCard(leaderCard);
        }
        $scope.setFactionDisplay = function(faction){
            $scope.selectedFaction = faction;
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
        }
    }]);

/*
    Tallies up the current cards and displays any deficiencies (too few unit cards, too many special cards)
*/
app.controller('cardTotalsCtrl',
    ['$scope',
    '$rootScope',
    function($scope, $rootScope){
        $scope.totalCards = 0;
        $scope.totalUnitCards = 0;
        $scope.totalSpecialCards = 0;
        $scope.totalUnitStrength = 0;
        $scope.totalHeroCards = 0;

        var deckChangedListener = $rootScope.$on('currentDeckChanged', function(event,data){
            $scope.calculateTotals(data);
        });
        $scope.calculateTotals = function(currentDeck){
            var totalHeroCards = 0;
            var totalCards = 0;
            var totalUnitStrength = 0;
            var totalSpecialCards = 0;
            var totalUnitCards = 0;
            var unitCount = 0;
            for (var i = 0; i < currentDeck.length; i++) {
                var card = currentDeck[i].card;
                var count = currentDeck[i].count;
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
    }]);

/*
    Displays all available cards per faction + neutral
    Primary functions: 
    Filter cards based on faction
    Notify via $broadcast when a card has been clicked
    Filter currently presented cards based on the 7 fixed filters (melee, ranged, siege, etc)
    Loads additional cards on the page using Infinite Scroll
*/
app.controller('availableCardsCtrl',
    ['$scope',
    '$rootScope',
    'cards',
    'currentDeckFactory',
    'existingDeck',
    function($scope, $rootScope, cards, currentDeckFactory, existingDeck){
        $scope.availableCardsSuperset = [];
        $scope.availableCardsInfiniteScrolling = [];
        $scope.availableCardsFilter = [];
        $scope.availableCardsFilterName = "all";
        $scope.availableCardsFilterDisplayName = "All Cards";

        cards.getAvailableCards()
            .success(function(data){
            $scope.availableCardsSuperset = data;
            if (existingDeck) {
                $scope.filterAvailableCardsByFaction(existingDeck.faction);
                $scope.loadExistingDeck(existingDeck);
            } else {
                $scope.filterAvailableCardsByFaction("northernrealms");
            }
        });
        var factionChangedListener = $rootScope.$on("factionChanged", function(event,data){
            $scope.filterAvailableCardsByFaction(data.newFaction);
        });

        $scope.$on('$destroy', factionChangedListener);
        $scope.cardClicked = function(clickedCard){
            var cardAndCount = {card:clickedCard, count:1};
            $rootScope.$broadcast('availableCardSelected',cardAndCount);
        };
        $scope.loadExistingDeck = function(existingDeck){
            var deck = existingDeck.cards;
            for (var i = 0; i < deck.length; i++) {
                var deck_id = deck[i].card._id;
                for (var j = 0; j < $scope.availableCards.length; j++) {
                    if ($scope.availableCards[j]._id == deck_id) {
                        var numberOfCards = deck[i].count;
                        var cardAndCount = {card:$scope.availableCards[j], count:numberOfCards};
                        $rootScope.$broadcast('availableCardSelected',cardAndCount);
                    };
                };
            };
        }
        $scope.filterAvailableCardsByFaction = function(faction){
            if ($scope.availableCardsSuperset.length == 0 ) {return;};
            if (faction === $scope.selectedFaction) {return;};
            $scope.selectedFaction = faction;
            var cardSubset = [];
            $scope.currentDeck = [];
            $scope.currentDeckFilter = [];
            for (var i = 0; i < $scope.availableCardsSuperset.length; i++) {
                if ($scope.availableCardsSuperset[i].faction === faction || $scope.availableCardsSuperset[i].faction === 'neutral') {
                    cardSubset.push($scope.availableCardsSuperset[i]);
                };
            };
            cardSubset.sort(cardSort);
            $scope.availableCards = cardSubset;
            $scope.availableCardsFilter = cardSubset;
            $scope.availableCardsInfiniteScrolling = [];
            $scope.availableCardsInfiniteScrolling = $scope.availableCardsFilter.slice(0,12);
            $scope.loadMoreAvailableCards();
        };
        $scope.switchAvailableCardsFilter = function(newType, newFilter){
            $scope.availableCardsFilterName = newFilter;
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

            $scope.availableCardsFilter.sort(cardSort);
            $scope.availableCardsInfiniteScrolling = [];            
            $scope.availableCardsInfiniteScrolling = $scope.availableCardsFilter.slice(0,12);
            $scope.loadMoreAvailableCards();
        };
        $scope.loadMoreAvailableCards = function () {
            if ($scope.availableCardsFilter.length == 0) {return;};
            if ($scope.availableCardsInfiniteScrolling.length == $scope.availableCardsFilter.length) {return;};
            var numberOfVisibleCards = $scope.availableCardsInfiniteScrolling.length-1;
            var newNumberOfVisibleCards = numberOfVisibleCards + 3;
            if (numberOfVisibleCards + newNumberOfVisibleCards >  $scope.availableCardsFilter.length) {
                newNumberOfVisibleCards =  $scope.availableCardsFilter.length;
            };
            for (var i = numberOfVisibleCards; i < newNumberOfVisibleCards; i++) {
                $scope.availableCardsInfiniteScrolling.push($scope.availableCardsFilter[i+1]);
            };
        };
    }]);

/*
    Presents the current deck of a user.
    Primary function:
    Load an existing deck from the database
    Adding/removing cards from the deck
    Filtering visible cards by prefixed filters (range, special, weather)

*/
app.controller('currentHandCtrl',
    ['$scope',
    '$rootScope',
    'cards',
    'currentDeckFactory',
    function($scope,$rootScope,cards,currentDeckFactory){     
        $scope.currentDeck = [];
        $scope.currentDeckFilter = [];
        $scope.currentDeckFilterName = "all";
        $scope.currentDeckFilterDisplayName = "All Cards";
        var availableCardSelectedListener = $rootScope.$on('availableCardSelected', function(event, data){
            $scope.putCardInDeck(data.card, data.count);
        });
        var factionChangedListener = $rootScope.$on("factionChanged", function(event,data){
            if (data.newFaction !== data.oldFaction) {
                $scope.clearDeck();
            };
        });
        $scope.$on('$destroy', availableCardSelectedListener);
        $scope.$on('$destroy', factionChangedListener);
        $scope.clearDeck = function(){
            $scope.currentDeck = [];
            $scope.currentDeckFilter = [];
            $rootScope.$broadcast('currentDeckChanged',$scope.currentDeck);
            var xyz = $scope.currentDeck;
            currentDeckFactory.setCards(xyz);
        };
        $scope.putCardInDeck = function(card,count){
            var cardFoundInDeck = false;
            for (var i = 0; i < $scope.currentDeck.length; i++) {
                var cardInDeck = $scope.currentDeck[i];
                if (cardInDeck.card === card) {
                    if (card.shiny) {
                        cardFoundInDeck = true;
                        break; // can't add two hero cards
                    };
                    cardInDeck.count+=count;
                    cardFoundInDeck = true;
                    break;
                };
            };
            if ($scope.currentDeck.length == 0 || !cardFoundInDeck) {
                $scope.currentDeck.push({'card':card, 'count': count});
            };
            $scope.refreshCurrentDeckFilter();
            $rootScope.$broadcast('currentDeckChanged',$scope.currentDeck);
            var xyz = $scope.currentDeck;
            currentDeckFactory.setCards(xyz);
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
            $rootScope.$broadcast('currentDeckChanged',$scope.currentDeck);
            var xyz = $scope.currentDeck;
            currentDeckFactory.setCards(xyz);
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

        $scope.refreshCurrentDeckFilter();
    }]);

/*
    This handles the saving of the users currently chosen deck.
*/
app.controller('deckBuilderCtrl',
    ['$scope',
    '$rootScope',
    'cards',
    'decks',
    'currentDeckFactory',
    'existingDeck',
    function($scope,$rootScope,cards,decks,currentDeckFactory,existingDeck){
        $scope.selectedFaction = '';
        $scope.deckName = '';
        $scope.savedURL = '';
        $scope.saveResultMessage = '';
        if (existingDeck) {
            $scope.deckName = existingDeck.deckName;
        };

        $scope.saveDeck = function(){
            var x = currentDeckFactory.deck;
            var deckToSave ={
                deckName:$scope.deckName,
                cards: currentDeckFactory.cards,
                faction: currentDeckFactory.faction,
                leaderCard : currentDeckFactory.leaderCard
            };
            decks.saveDeck(deckToSave).success(function(data){
                $scope.savedURL = "http://localhost:20933/#/decks/" + data._id;
                $scope.saveResultMessage = "Deck Saved";
            });
        };

    }]);

//Custom sorting for cards based first on faction, then range.
var cardSort = function (a, b) {
    var aFaction = a.faction.toUpperCase();
    var bFaction = b.faction.toUpperCase();

    var aRange = a.range.length === 0 ? "A" : a.range[0].toUpperCase();
    var bRange = b.range.length === 0 ? "A" : b.range[0].toUpperCase();

    var aName = a.cardName;
    var bName = b.cardName;

    if (aFaction < bFaction) return -1;
    if (aFaction > bFaction) return 1;
    if (aRange < bRange) return -1;
    if (aRange > bRange) return 1;
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return 0;
}