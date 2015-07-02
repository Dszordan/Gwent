var app = angular.module('gwentjs',['ui.router','gwentjs.configuration','gwentjs.services','ui.bootstrap']);
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
    '$modal',
    'existingDeck',
    function($scope,$rootScope, cards, currentDeckFactory, $modal, existingDeck){
        $scope.availableLeaderCardsSuperset = {};
        $scope.currentLeaderCard = {};
        $scope.leaderCardsFilter = [];
        $scope.selectedFaction = "";
        $scope.showAllLeaderCards = false;

        var modalWindow = undefined;

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
        $scope.openAllCardsDialog = function(){
            $rootScope.theme = 'ngdialog-theme-default';
            showAllLeaderCards = true;
            modalWindow = $modal.open({ 
                templateUrl: 'allCardsDialog',
                scope:$scope,
                windowClass: 'app-modal-window'});
        };
        $scope.changeFaction = function (faction) {
            var oldAndNewFaction = {oldFaction: $scope.selectedFaction, newFaction:faction};
            $scope.leaderCardsFilter = [];
            $scope.setFactionDisplay(faction);
            for (var i = 0; i < $scope.availableLeaderCardsSuperset.length; i++) {
                if($scope.availableLeaderCardsSuperset[i].faction === faction)
                    $scope.leaderCardsFilter.push($scope.availableLeaderCardsSuperset[i]);
            };
            $scope.changeLeaderCard($scope.leaderCardsFilter[0]);
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
            if (modalWindow)
                modalWindow.close();
            currentDeckFactory.setLeaderCard(leaderCard);
            $rootScope.$broadcast('leaderCardChanged', leaderCard);
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
    'currentDeckFactory',
    '$rootScope',
    'existingDeck',
    function($scope, currentDeckFactory, $rootScope, existingDeck){
        $scope.totalCards = 0;
        $scope.totalUnitCards = 0;
        $scope.totalSpecialCards = 0;
        $scope.totalUnitStrength = 0;
        $scope.totalHeroCards = 0;
        $scope.leaderAbility = 'Pick an Impenetrable Fog card from your deck and play it instantly.';
        $scope.factionPassive = currentDeckFactory.getFactionPassive('northernrealms');
        $scope.showTotals = false;
        
        if (existingDeck) {
            $scope.leaderAbility = existingDeck.leaderCard.ability;
            $scope.factionPassive = currentDeckFactory.getFactionPassive(existingDeck.leaderCard.faction);
        };

        var deckChangedListener = $rootScope.$on('currentDeckChanged', function(event,data){
            $scope.calculateTotals(data);
        });
        var showTotalsListener = $rootScope.$on('windowAboveDeckBuilder', function(data){
            $scope.showTotals = false;
        });
        var hideTotalsListener = $rootScope.$on('windowBelowDeckBuilder', function(data){
            $scope.showTotals = true;
        });
        var leaderChangedListener = $rootScope.$on('leaderCardChanged', function(event,data){
            $scope.leaderAbility = currentDeckFactory.leaderCard.ability;
            $scope.factionPassive = currentDeckFactory.getFactionPassive(currentDeckFactory.leaderCard.faction);
        });
        $scope.$on('$destroy', leaderChangedListener);
        $scope.$on('$destroy', deckChangedListener);
        $scope.$on('$destroy', showTotalsListener);
        $scope.$on('$destroy', hideTotalsListener);
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
*/
app.controller('availableCardsCtrl',
    ['$scope',
    '$rootScope',
    'cards',
    'currentDeckFactory',
    'existingDeck',
    function($scope, $rootScope, cards, currentDeckFactory, existingDeck){
        $scope.availableCardsSuperset = [];
        $scope.availableCardsFilter = [];
        $scope.availableCardsFilterName = "all";
        $scope.availableCardsFilterDisplayName = "All Cards";

        //Pagination / slides
        $scope.slides = [];
        var cardsPerSlide = 9;

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
            $rootScope.$broadcast('deactivateNotifications',{});
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
            $rootScope.$broadcast('activateNotifications',{});
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
            $scope.loadSlides();
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
            $scope.loadSlides();
        };
        $scope.loadSlides = function(){
            $scope.slides = [];
            var numberOfFullSlides = Math.floor($scope.availableCardsFilter.length / cardsPerSlide);
            for (var i = 0; i < numberOfFullSlides; i++) {
                var startRange = cardsPerSlide * i;
                var endRange = cardsPerSlide * (i + 1);

                $scope.addSlide($scope.availableCardsFilter.slice(startRange,endRange),[]);
            };
            var leftoverCards = $scope.availableCardsFilter.length % cardsPerSlide;
            if (leftoverCards != 0) {
                var startRange = cardsPerSlide * numberOfFullSlides;
                var endRange = cardsPerSlide * numberOfFullSlides + leftoverCards;

                var padding = [];
                for (var i = 0; i < (cardsPerSlide - leftoverCards); i++) {
                    padding.push({});
                };
                $scope.addSlide($scope.availableCardsFilter.slice(startRange,endRange),padding);
            };
        };
        $scope.addSlide = function(cardSubset, blankCards){
            $scope.slides.push({
                cards:cardSubset,
                padding:blankCards
            });
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

        //Pagination / slides
        $scope.slides = [];
        var cardsPerSlide = 9;

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
            $scope.loadSlides();
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
                        $rootScope.$broadcast('invalidAction',{msg:'Can\'t add two of the same hero cards.',img:card.cardArtImageName});
                        break; // can't add two hero cards
                    };
                    cardInDeck.count+=count;
                    cardFoundInDeck = true;
                    $rootScope.$broadcast('singleCardAdded',card);
                    break;
                };
            };
            if ($scope.currentDeck.length == 0 || !cardFoundInDeck) {
                $scope.currentDeck.push({'card':card, 'count': count});
                $rootScope.$broadcast('singleCardAdded',card);
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
                        $scope.loadSlides();
                    };
                    break;
                };
            };
            $rootScope.$broadcast('currentDeckChanged',$scope.currentDeck);
            $rootScope.$broadcast('singleCardRemoved',card);
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
                $scope.loadSlides();
        }
        $scope.loadSlides = function(){
            var currentSlideIndex = 0;
            if ($scope.slides != undefined && $scope.slides.length > 0) {
                var currentSlide = $scope.slides.filter(function (s) { return s.active; })[0];
                currentSlideIndex = $scope.slides.indexOf(currentSlide);
            };
            $scope.slides = [];
            var numberOfFullSlides = Math.floor($scope.currentDeckFilter.length / cardsPerSlide);
            for (var i = 0; i < numberOfFullSlides; i++) {
                var startRange = cardsPerSlide * i;
                var endRange = cardsPerSlide * (i + 1);

                $scope.addSlide($scope.currentDeckFilter.slice(startRange,endRange),[]);
            };

            var leftoverCards = $scope.currentDeckFilter.length % cardsPerSlide;
            if (leftoverCards != 0) {
                var startRange = cardsPerSlide * numberOfFullSlides;
                var endRange = cardsPerSlide * numberOfFullSlides + leftoverCards;

                var padding = [];
                for (var i = 0; i < (cardsPerSlide - leftoverCards); i++) {
                    padding.push({});
                };
                $scope.addSlide($scope.currentDeckFilter.slice(startRange,endRange),padding);
            };
            if ($scope.currentDeckFilter.length == 0) {
                 var padding = [];
                for (var i = 0; i < (cardsPerSlide - leftoverCards); i++) {
                    padding.push({});
                };
                $scope.addSlide({},padding);  
            };
            if ($scope.slides.length != 0) {
                if ($scope.slides.length < currentSlideIndex + 1) {
                    $scope.slides[currentSlideIndex - 1].active = true;
                } else {
                    $scope.slides[currentSlideIndex].active = true;
                };
            };
        };
        $scope.addSlide = function(cardSubset, blankCards){
            $scope.slides.push({
                active:false,
                cards:cardSubset,
                padding:blankCards
            });
        };

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
        $scope.validationMessage = '';
        $scope.windowBelowElement = false;
        if (existingDeck) {
            $scope.deckName = existingDeck.deckName;
        };

        var scrollBelowElementListener = $scope.$on('scrolledBelowElement', function(event, data){
            $scope.windowBelowElement = true;
            $rootScope.$broadcast('windowBelowDeckBuilder','');
        });
         var scrollAboveElementListener = $scope.$on('scrolledAboveElement', function(event, data){
            $scope.windowBelowElement = false;
            $rootScope.$broadcast('windowAboveDeckBuilder','');
        });

        $scope.$on('$destroy', scrollBelowElementListener);
        $scope.$on('$destroy', scrollAboveElementListener);
        $scope.saveDeck = function(){
            var deckToSave ={
                deckName:$scope.deckName,
                cards: currentDeckFactory.cards,
                faction: currentDeckFactory.faction,
                leaderCard : currentDeckFactory.leaderCard
            };
            if (deckToSave.cards.length == 0) {
                $scope.validationMessage = "Need to add at least one card.";
                return;
            };
            decks.saveDeck(deckToSave).success(function(data){
                $scope.savedURL = "http://localhost:20933/#/decks/" + data._id;
                $scope.saveResultMessage = "Deck Saved";
            });
        };
    }]);


app.controller('notificationsCtrl', ['$scope','$rootScope','$timeout', function ($scope,$rootScope,$timeout) {
    $scope.alerts = [];
    $scope.active = true;

    var cardAddedListener = $rootScope.$on('singleCardAdded', function(event, data){
        var cardname = data.cardName;
        var newAlert = {
            img:data.cardArtImageName,
            msg:"Card added",
            type:"success"
        }
        $scope.addAlert(newAlert);
    });

    var cardRemovedListener = $rootScope.$on('singleCardRemoved', function(event, data){
        var cardname = data.cardName;
        var newAlert = {
            img:data.cardArtImageName,
            msg:"Card removed ",
            type:"danger"
        }
        $scope.addAlert(newAlert);
    });

    var invalidActionListener =  $rootScope.$on('invalidAction', function(event, data){
        var newAlert = {
            img:data.img,
            msg:data.msg,
            type:"warning"
        }
        $scope.addAlert(newAlert);
    });

    var deactivateNotificationsListener = $rootScope.$on('deactivateNotifications', function(event, data){
         $scope.active = false;
    });
    var activateNotificationsListener = $rootScope.$on('activateNotifications', function(event, data){
        $scope.active = true;
    });

    $scope.$on('$destroy', cardRemovedListener);
    $scope.$on('$destroy', cardAddedListener);
    $scope.addAlert = function(newAlert) {
        if (!$scope.active) {return;};
        $scope.alerts.push(newAlert);
        $timeout(function(){
            var indexOfItem = $scope.alerts.indexOf(newAlert);
            $scope.alerts.splice(indexOfItem,1);
          }, 1250);
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
}]);

app.controller('viewDeckCtrl',['$scope',
    '$rootScope',
    'cards',
    '$state',
    'existingDeck',
    function($scope,$rootScope,cards,$state,existingDeck){     
        $scope.currentDeck = [];
        $scope.currentDeckFilter = [];
        $scope.availableCardsSuperset = []
        $scope.currentDeckFilterName = "all";
        $scope.currentDeckFilterDisplayName = "All Cards";
        $scope.deckName = '';

        //Pagination / slides
        $scope.slides = [];
        var cardsPerSlide = 1000;

        cards.getAvailableCards()
            .success(function(data){
            $scope.availableCardsSuperset = data;
            if (existingDeck) {
                $scope.loadExistingDeck(existingDeck);
                $rootScope.$broadcast('windowBelowDeckBuilder',$scope.currentDeck);
                $scope.deckName = existingDeck.deckName == '' ? 'Anonymous Deck' : existingDeck.deckName;
            }
        });

        $scope.cloneDeck = function () {
            $state.go('loadDeck',{id:existingDeck._id});
        };
        $scope.clearDeck = function(){
            $scope.currentDeck = [];
            $scope.currentDeckFilter = [];
            $scope.loadSlides();
        };
        $scope.switchCurrentCardsFilter = function(newType, newFilter){
            $scope.currentDeckFilterName = newFilter;
            if (newType == "predefined") {
                $scope.refreshCurrentDeckFilter();
            };
        };
        $scope.loadExistingDeck = function(existingDeck){
            var deck = existingDeck.cards;
            for (var i = 0; i < deck.length; i++) {
                var deck_id = deck[i].card._id;
                for (var j = 0; j < $scope.availableCardsSuperset.length; j++) {
                    if ($scope.availableCardsSuperset[j]._id == deck_id) {
                        var numberOfCards = deck[i].count;
                        var cardAndCount = {card:$scope.availableCardsSuperset[j], count:numberOfCards};
                        $scope.putCardInDeck(cardAndCount.card, numberOfCards)
                    };
                };
            };            
            $rootScope.$broadcast('currentDeckChanged',$scope.currentDeck);
        }
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
                $scope.loadSlides();
        }
        $scope.loadSlides = function(){
            var currentSlideIndex = 0;
            if ($scope.slides != undefined && $scope.slides.length > 0) {
                var currentSlide = $scope.slides.filter(function (s) { return s.active; })[0];
                currentSlideIndex = $scope.slides.indexOf(currentSlide);
            };
            $scope.slides = [];
            $scope.addSlide($scope.currentDeckFilter,[]);
           
        };
        $scope.addSlide = function(cardSubset, blankCards){
            $scope.slides.push({
                active:false,
                cards:cardSubset,
                padding:blankCards
            });
        };

        $scope.refreshCurrentDeckFilter();
    }]);

app.directive("scroll", function ($window) {
    return {
        link: function(scope, element, attrs) {
            angular.element($window).bind("scroll", function() {
                 if (this.pageYOffset >= element[0].offsetTop - 150) { 
                    if (!scope.windowBelowElement) {
                        scope.$broadcast('scrolledBelowElement','');
                        console.log('below ');
                    };
                 } else {
                    if (scope.windowBelowElement) {
                        scope.$broadcast('scrolledAboveElement','');
                        console.log('above');
                    };
                 }

                scope.$apply();
            });
        }
    }
});

//Custom sorting for cards based first on faction, then range.
var cardSort = function (a, b) {
    var aFaction = a.faction.toUpperCase();
    var bFaction = b.faction.toUpperCase();
    if (aFaction == 'neutral') {aFaction = 'A'};
    if (bFaction == 'neutral') {bFaction = 'A'};
    
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