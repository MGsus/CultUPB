var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var _ = require('underscore');
var async = require('async');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Motor = require('./lib/engine');
var cursos = require('./data/cursos.json');

var e = new Motor;

var app = express();

// view motor setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.route('/').get(function (arg, res, next) {
    var query;
    query = arg.query;
    return async.auto({
        likes: (function (_this) {
            return function (done) {
                return e.likes.itemsPorUsuario(query.usuario, done);
            };
        })(this),
        dislikes: (function (_this) {
            return function (done) {
                return e.dislikes.itemsPorUsuario(query.usuario, done);
            };
        })(this)
    }, (function (_this) {
        return function (err, arg1) {
            var dislikes, likes;
            likes = arg1.likes, dislikes = arg1.dislikes;
            if (err != null) {
                return next(err);
            }
            return res.render('index', {
                cursos: cursos,
                usuario: query.usuario,
                likes: likes,
                dislikes: dislikes,
            });
        };
    })(this));
});

app.route('/recomend').get(function (arg, res, next) {
    var query;
    query = arg.query;
    return async.auto({
        likes: (function (_this) {
            return function (done) {
                return e.likes.itemsPorUsuario(query.usuario, done);
            };
        })(this),
        dislikes: (function (_this) {
            return function (done) {
                return e.dislikes.itemsPorUsuario(query.usuario, done);
            };
        })(this),
        recomendaciones: (function (_this) {
            return function (done) {
                return e.recomendaciones.forUser(query.usuario, function (err, recomendaciones) {
                    if (err != null) {
                        return done(err);
                    }
                    return done(null, _.map(_.sortBy(recomendaciones, function (recomendacion) {
                        return -recomendacion.weight;
                    }), function (recomendacion) {
                        return _.findWhere(cursos, {
                            id: recomendacion.item
                        });
                    }));
                });
            };
        })(this)
    }, (function (_this) {
        return function (err, arg1) {
            var likes, dislikes, recomendaciones;
            likes = arg1.likes, dislikes = arg1.dislikes, recomendaciones = arg1.recomendaciones;
            if (err != null) {
                return next(err);
            }
            return res.render('recomend', {
                cursos: cursos,
                usuario: query.usuario,
                likes: likes,
                dislikes: dislikes,
                recomendaciones: recomendaciones.slice(0, 4)
            })
        };
    })(this));
});

app.route('/like').post(function (arg, res, next) {
    var query;
    query = arg.query;
    if (query.unset === 'yes') {
        return e.likes.remove(query.usuario, query.curso, (function (_this) {
            return function (err) {
                if (err != null) {
                    return next(err);
                }
                return res.redirect("/?usuario=" + query.usuario);
            };
        })(this));
    } else {
        return e.dislikes.remove(query.usuario, query.curso, (function (_this) {
            return function (err) {
                if (err != null) {
                    return next(err);
                }
                return e.likes.add(query.usuario, query.curso, function (err) {
                    if (err != null) {
                        return next(err);
                    }
                    return res.redirect("/?usuario=" + query.usuario);
                });
            };
        })(this));
    }
});

app.route('/dislike').post(function (arg, res, next) {
    var query;
    query = arg.query;
    if (query.unset === 'yes') {
        return e.dislikes.remove(query.usuario, query.curso, (function (_this) {
            return function (err) {
                if (err != null) {
                    return next(err);
                }
                return res.redirect("/?usuario=" + query.usuario);
            };
        })(this));
    } else {
        return e.likes.remove(query.usuario, query.curso, (function (_this) {
            return function (err) {
                if (err != null) {
                    return next(err);
                }
                return e.dislikes.add(query.usuario, query.curso, function (err) {
                    if (err != null) {
                        return next(err);
                    }
                });
            };
        })(this));
    }
});

module.exports = Motor;
module.exports = app;

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404);
    res.render('error', {url: req.url});

});

