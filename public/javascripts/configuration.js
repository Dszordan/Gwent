var app = angular.module('gwentjs.configuration',['ngDialog']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider){
        $stateProvider
            .state('deckBuilder', {
              url: '/home',
              resolve: {'existingDeck':function(){return ''}},
                views:{
                    'deckBuilder':{
                        templateUrl: '/templates/deckBuilder.html',
                        controller: 'deckBuilderCtrl'
                    },
                    'leaderSelection@deckBuilder':{
                        templateUrl: '/templates/leaderCardSelection.html',
                        controller: 'leaderSelectionCtrl'
                    },
                    'cardTotals':{
                        templateUrl: '/templates/cardTotals.html',
                        controller: 'cardTotalsCtrl'
                    },
                    'availableCardSelection@deckBuilder':{
                        templateUrl: '/templates/availableCardsSelection.html',
                        controller: 'availableCardsCtrl'
                    },
                    'deckCardSelection@deckBuilder':{
                        templateUrl: '/templates/deckCardsSelection.html',
                        controller: 'currentHandCtrl'
                    }
                }   
            })
            .state('loadDeck',{
                url:'/decks/{id}',
                resolve: {
                  'existingDeck' : 
                    ['$stateParams', 'decks', 'currentDeckFactory', function($stateParams, decks, currentDeckFactory){
                        return decks.getDeck($stateParams.id);
                    }]
                },
                views:{
                    'deckBuilder':{
                        templateUrl: '/templates/deckBuilder.html',
                        controller: 'deckBuilderCtrl'
                    },
                    'leaderSelection@loadDeck':{
                        templateUrl: '/templates/leaderCardSelection.html',
                        controller: 'leaderSelectionCtrl'
                    },
                    'cardTotals':{
                        templateUrl: '/templates/cardTotals.html',
                        controller: 'cardTotalsCtrl'
                    },
                    'availableCardSelection@loadDeck':{
                        templateUrl: '/templates/availableCardsSelection.html',
                        controller: 'availableCardsCtrl'
                    },
                    'deckCardSelection@loadDeck':{
                        templateUrl: '/templates/deckCardsSelection.html',
                        controller: 'currentHandCtrl'
                    }
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

app.config(['ngDialogProvider', function (ngDialogProvider) {
            ngDialogProvider.setDefaults({
                className: 'ngdialog-theme-default',
                plain: false,
                showClose: true,
                closeByDocument: true,
                closeByEscape: true,
                appendTo: true
            });
        }]);
