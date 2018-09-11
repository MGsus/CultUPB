var Bourne, Similitd, _, async;

_ = require('underscore');

async = require('async');

Bourne = require('bourne');

module.exports = Similitd = (function () {
    function Similitud(motor) {
        this.motor = motor;
        this.db = new Bourne('./db-similitudes.json');
    }

    Similitud.prototype.byUser = function (usuario, done) {
        return this.db.findOne({
            usuario: usuario
        }, (function (_this) {
            return function (err, arg) {
                var others;
                others = arg.others;
                if (err != null) {
                    return done(err);
                }
                return done(null, others);
            };
        })(this));
    };

    Similitud.prototype.update = function (usuario, done) {
        return async.auto({
            userLikes: (function (_this) {
                return function (done) {
                    return _this.motor.likes.itemsPorUsuario(usuario, done);
                };
            })(this),
            userDislikes: (function (_this) {
                return function (done) {
                    return _this.motor.dislikes.itemsPorUsuario(usuario, done);
                };
            })(this)
        }, (function (_this) {
            return function (err, arg) {
                var items, userDislikes, userLikes;
                userLikes = arg.userLikes, userDislikes = arg.userDislikes;
                if (err != null) {
                    return done(err);
                }
                items = _.flatten([userLikes, userDislikes]);
                return async.map(items, function (item, done) {
                    return async.map([_this.motor.likes, _this.motor.dislikes], function (calificaciones, done) {
                        return calificaciones.usuariosPorItem(item, done);
                    }, done);
                }, function (err, others) {
                    if (err != null) {
                        return done(err);
                    }
                    others = _.without(_.unique(_.flatten(others)), usuario);
                    return _this.db["delete"]({
                        usuario: usuario
                    }, function (err) {
                        if (err != null) {
                            return done(err);
                        }
                        return async.map(others, function (other, done) {
                            return async.auto({
                                otherLikes: function (done) {
                                    return _this.motor.likes.itemsPorUsuario(other, done);
                                },
                                otherDislikes: function (done) {
                                    return _this.motor.dislikes.itemsPorUsuario(other, done);
                                }
                            }, function (err, arg1) {
                                var otherDislikes, otherLikes;
                                otherLikes = arg1.otherLikes, otherDislikes = arg1.otherDislikes;
                                if (err != null) {
                                    return done(err);
                                }
                                return done(null, {
                                    usuario: other,
                                    similaridad: (_.intersection(userLikes, otherLikes).length + _.intersection(userDislikes, otherDislikes).length - _.intersection(userLikes, otherDislikes).length - _.intersection(userDislikes, otherLikes).length) / _.union(userLikes, otherLikes, userDislikes, otherDislikes).length
                                });
                            });
                        }, function (err, others) {
                            if (err != null) {
                                return next(err);
                            }
                            return _this.db.insert({
                                usuario: usuario,
                                others: others
                            }, done);
                        });
                    });
                });
            };
        })(this));
    };

    return Similitud;

})();