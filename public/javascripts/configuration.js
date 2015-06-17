var app = angular.module('gwentjs.configuration',[]);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider){
        $stateProvider
            .state('home', {
              url: '/home',
              views:{
                'deckBuilder':{
                    templateUrl: '/templates/deckBuilder.html',
                    controller: 'deckBuilderCtrl',
                    resolve:{
                    deck: ['$stateParams', 'decks', function($stateParams, decks){
                                  return '';
                        }]
                    }
                }
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