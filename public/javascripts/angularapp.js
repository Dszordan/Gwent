var app = angular.module('flapperNews',['ui.router']);

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

app.controller('PostsCtrl',[
    '$scope',
    'posts',
    'post',
    'auth',
    function($scope, posts, post, auth){
        $scope.post = post;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.addComment = function(){
            if (!$scope.body || $scope.body === '') {return;};
            posts.addComment(post._id, {
                body: $scope.body,
                author: 'user'
            }).success(function(comment){
                $scope.post.comments.push(comment);
            });
            $scope.body = '';
        };
        $scope.incrementUpvotes = function(comment){
            posts.upvoteComment(post, comment);
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
    function($scope,cards){
        cards.getAvailableCards();
        $scope.availableCards = cards.availableCards;
        $scope.currentDeck = [];
        $scope.totalCards = 0;
        $scope.totalUnitCards = 0;
        $scope.totalSpecialCards = 0;
        $scope.totalUnitStrength = 0;
        $scope.totalHeroCards = 0;
        $scope.putCardInDeck = function(card){
            var cardFoundInDeck = false;
            for (var i = 0; i < $scope.currentDeck.length; i++) {
                var cardInDeck = $scope.currentDeck[i];
                if (cardInDeck.card === card) {
                    cardInDeck.count++;
                    cardFoundInDeck = true;
                    break;
                };
            };
            if ($scope.currentDeck.length == 0 || !cardFoundInDeck) {
                $scope.currentDeck.push({'card':card, 'count': 1});
            };
            this.calculateTotals();
        };
        $scope.removeCardFromDeck = function(card){
            var cardFoundInDeck = false;
            for (var i = 0; i < $scope.currentDeck.length; i++) {
                var cardInDeck = $scope.currentDeck[i];
                if (cardInDeck.card === card) {
                    cardInDeck.count--;
                    if (cardInDeck.count == 0) {
                        $scope.currentDeck.splice(i, 1);
                    };
                    break;
                };
            };
            this.calculateTotals();
        };
        $scope.calculateTotals = function(){
            var totalHeroCards = 0;
            var totalCards = 0;
            var totalUnitStrength = 0;
            var totalSpecialCards = 0;
            var totalUnitCards = 0;
            for (var i = 0; i < $scope.currentDeck.length; i++) {
                var card = $scope.currentDeck[i].card;
                var count = $scope.currentDeck[i].count;
                if (card.shiny) {
                    totalHeroCards++;
                };
                totalUnitStrength+=card.strength * count;
                totalCards+= count;
            };

            $scope.totalCards = totalCards;
            $scope.totalUnitCards = totalCards;
            $scope.totalSpecialCards = 0;
            $scope.totalUnitStrength = totalUnitStrength;
            $scope.totalHeroCards = totalHeroCards;
        };
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

app.factory('posts',['$http','auth', function($http, auth){
    //service body
    var o = {
        posts:[]
    };
    o.getAll = function(){
        return $http.get('/posts').success(function(data){
            angular.copy(data, o.posts);
        });
    };
    o.create = function(post) {
        return $http.post('/posts', post, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data){
            o.posts.push(data);
        });
    };
    o.upvote = function(post){
        return $http.put('/posts/'+post._id+'/upvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data){
            post.upvotes++;
        });
    };
    o.downvote = function(post){
        return $http.put('/posts/' + post._id + '/downvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data){
            post.upvotes--;
        });
    };
    o.get = function(id) {
      return $http.get('/posts/' + id).then(function(res){
        return res.data;
      });
    };
    o.addComment = function(id, comment){
        return $http.post('/posts/' + id + '/comments', comment, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        });
    };
    o.upvoteComment = function(post, comment){
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        })
        .success(function(data){
            comment.upvotes++;
        });
    };
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
              controller: 'deckBuilderCtrl'
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
            .state('posts', {
              url: '/posts/{id}',
              templateUrl: '/templates/comments.html',
              controller: 'PostsCtrl',
              resolve:{
                  post: ['$stateParams', 'posts', function($stateParams, posts) {
                        return posts.get($stateParams.id);
                    }]
              }
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