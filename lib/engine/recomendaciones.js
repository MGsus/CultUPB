var Bourne, Recomendaciones, _, async;

_ = require('underscore');

async = require('async');

Bourne = require('bourne');

module.exports = Recomendaciones = (function () {
    function Recomendaciones(motor) {
        this.motor = motor;
        this.db = new Bourne('./db-recomendaciones.json');
    }

    Recomendaciones.prototype.forUser = function (usuario, done) {
        return this.db.findOne({
            usuario: usuario
        }, function (err, arg) {
            var recomendaciones;
            recomendaciones = (arg != null ? arg : {
                recomendacion: []
            }).recomendaciones;
            if (err != null) {
                return done(err);
            }
            return done(null, recomendaciones);
        });
    };

    Recomendaciones.prototype.update = function (usuario, done) {
        return this.motor.similitud.byUser(usuario, (function (_this) {
            return function (err, others) {
                if (err != null) {
                    return done(err);
                }
                return async.auto({
                    likes: function (done) {
                        return _this.motor.likes.itemsPorUsuario(usuario, done);
                    },
                    dislikes: function (done) {
                        return _this.motor.dislikes.itemsPorUsuario(usuario, done);
                    },
                    items: function (done) {
                        return async.map(others, function (other, done) {
                            return async.map([_this.motor.likes, _this.motor.dislikes], function (calificacion, done) {
                                return calificacion.itemsPorUsuario(other.usuario, done);
                            }, done);
                        }, done);
                    }
                }, function (err, arg) {
                    var dislikes, items, likes;
                    likes = arg.likes, dislikes = arg.dislikes, items = arg.items;
                    if (err != null) {
                        return done(err);
                    }
                    items = _.difference(_.unique(_.flatten(items)), likes, dislikes);
                    return _this.db["delete"]({
                        usuario: usuario
                    }, function (err) {
                        if (err != null) {
                            return done(err);
                        }
                        return async.map(items, function (item, done) {
                            return async.auto({
                                likers: function (done) {
                                    return _this.motor.likes.usuariosPorItem(item, done);
                                },
                                dislikers: function (done) {
                                    return _this.motor.dislikes.usuariosPorItem(item, done);
                                }
                            }, function (err, arg1) {
                                var dislikers, i, len, likers, numerator, other, ref;
                                likers = arg1.likers, dislikers = arg1.dislikers;
                                if (err != null) {
                                    return done(err);
                                }
                                numerator = 0;
                                ref = _.without(_.flatten([likers, dislikers]), usuario);
                                for (i = 0, len = ref.length; i < len; i++) {
                                    other = ref[i];
                                    other = _.findWhere(others, {
                                        usuario: other
                                    });
                                    if (other != null) {
                                        numerator += other.similaridad;
                                    }
                                }
                                return done(null, {
                                    item: item,
                                    weight: numerator / _.union(likers, dislikers).length
                                });
                            });
                        }, function (err, recomendaciones) {
                            if (err != null) {
                                return done(err);
                            }
                            return _this.db.insert({
                                usuario: usuario,
                                recomendaciones: recomendaciones
                            }, done);
                        });
                    });
                });
            };
        })(this));
    };

    return Recomendaciones;

})();