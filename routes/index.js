var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var Card = mongoose.model('Card');

var auth = jwt({secret:'SECRET', userProperty: 'payLoad'});
 
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET All posts GWENT*/
router.get('/cards', function(req, res, next){
    Card.find(function(err, cards){
        if (err) {next(err);};

        res.json(cards);
    });
});

router.get('/cards/:card', function(req, res, next){
    res.json(req.card);
});

/* GET All posts*/
router.get('/posts', function(req, res, next){
    Post.find(function(err, posts){
        if (err) {next(err);};

        res.json(posts);
    });
});

/* GET specific post */
router.get('/posts/:post', function(req,res,next){
    req.post.populate('comments', function(err, post){
        if (err) {return next(err);};

        res.json(post);
    })
});

/* POST Register a new user*/
router.post('/register', function(req, res, next){
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message:'Please fill out all fields'});
    };

    var user = new User();

    user.username = req.body.username;
    user.setPassword(req.body.password);

    user.save(function(err){
        if (err) {return next(err);};

        return res.json({token:user.generateJWT()});
    });
});

/*POST login */
router.post('/login', function(req, res, next){
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message:'Please fill out all fields'});
    };

    passport.authenticate('local', function(err, user, info){
        if (err) {return next(err);};

        if (user) {
            return res.json({token:user.generateJWT()});
        } else {
            return res.status(401).json(info);
        };
    })(req,res,next);
});

/* POST - Create new card */
router.post('/cards', function(req, res, next){
    var card = new Card(req.body);
    card.save(function(err, card){
        if (err) {next(err);};

        res.json(card);
    });
});

/* POST - create new post */
router.post('/posts', auth, function(req,res,next){
    var post = new Post(req.body);
    post.author = req.payLoad.username;

    post.save(function(err, post){
        if (err) {next(err);};

        res.json(post);
    })
});

/* POST - Create a comment to a post */
router.post('/posts/:post/comments', auth , function(req,res,next){
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payLoad.username;

    comment.save(function(err, comment){
        if (err) {return next(err);};

        req.post.comments.push(comment);
        req.post.save(function(err,post){
            if (err) {return next(err);};

            res.json(comment);
        });
    });
});

router.put('/cards/:existingCard/modify', function(req, res, next){
    console.log('beginning update');
    var cardValues = new Card(req.body);
    console.log('card = ' + cardValues + 'id + ' + req.existingCard);
    Card.findOneAndUpdate(
        {_id:req.params.existingCard},
        cardValues,
        function(err, updatedCard){
            if (err) {return next(err);};
            // console.log('no error ' + updatedCard + ' ' + ' ' + err);
            if (!updatedCard) {return next(new Error('Somehow we couldn\'t update the card.'))};
            // console.log('updated card exists');

            res.json(updatedCard);
        });
});

/*PUT - Upvote a post*/
router.put('/posts/:post/upvote', auth, function(req,res, next){
    req.post.upvote(function(err, post){
        if (err) {return next(err);};
        res.json(post);
    });
});

/*PUT - Downvote a post */
router.put('/posts/:post/downvote', auth, function(req, res, next){
    req.post.downvote(function(err, post){
        if (err) {return next(err);};
        res.json(post);
    });
});

/*PUT - Upvote a comment on a post */
router.put('/posts/:post/comments/:comment/upvote', auth, function(req,res,next){
    req.comment.upvote(function(err, comment){
        if (err) {return next(err);};
        res.json(comment);
    });
});

router.param('card', function(req,res,next,id){
    var query = Card.findById(id);

    query.exec(function(err, card){
        if(err){return next(err);};
        if(!card){return next(new Error('card doesn\' exist'))};

        req.card = card;
        return next();
    });
});

router.param('post', function(req,res,next,id){
    var query = Post.findById(id);

    query.exec(function(err, post){
        if (err) {return next(err);};
        if (!post) {return next(new Error('can\'t find post'))};

        req.post = post;
        return next();
    });
});

router.param('comment', function(req,res,next,id){
    var query = Comment.findById(id);

    query.exec(function(err, comment){
        if (err) {return next(err);};
        if (!comment) {return next(new Error('can\'t find comment'))};

        req.comment = comment;
        return next();
    });
});

module.exports = router;