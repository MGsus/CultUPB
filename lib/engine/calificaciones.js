var Bourne, Calificaciones, _, async;

_ = require('underscore');

async = require('async');

Bourne = require('bourne');

module.exports = Calificaciones = (function() {
    function Calificaciones(motor, nombre) {
        this.motor = motor;
        this.nombre = nombre;
        this.db = new Bourne("./db-" + this.nombre + ".json");
    }

    Calificaciones.prototype.add = function(usuario, item, done) {
        return this.db.find({
            usuario: usuario,
            item: item
        }, (function(_this) {
            return function(err, res) {
                if (err != null) {
                    return done(err);
                }
                if (res.length > 0) {
                    return done();
                }
                return _this.db.insert({
                    usuario: usuario,
                    item: item
                }, function(err) {
                    if (err != null) {
                        return done(err);
                    }
                    return async.series([
                        function(done) {
                            return _this.motor.similitud.update(usuario, done);
                        }, function(done) {
                            return _this.motor.recomendaciones.update(usuario, done);
                        }
                    ], done);
                });
            };
        })(this));
    };

    Calificaciones.prototype.remove = function(usuario, item, done) {
        return this.db["delete"]({
            usuario: usuario,
            item: item
        }, (function(_this) {
            return function(err) {
                if (err != null) {
                    return done(err);
                }
                return async.series([
                    function(done) {
                        return _this.motor.similitud.update(usuario, done);
                    }, function(done) {
                        return _this.motor.recomendaciones.update(usuario, done);
                    }
                ], done);
            };
        })(this));
    };

    Calificaciones.prototype.itemsPorUsuario = function(usuario, done) {
        return this.db.find({
            usuario: usuario
        }, (function(_this) {
            return function(err, calificaciones) {
                if (err != null) {
                    return done(err);
                }
                return done(null, _.pluck(calificaciones, 'item'));
            };
        })(this));
    };

    Calificaciones.prototype.usuariosPorItem = function(item, done) {
        return this.db.find({
            item: item
        }, (function(_this) {
            return function(err, calificaciones) {
                if (err != null) {
                    return done(err);
                }
                return done(null, _.pluck(calificaciones, 'usuario'));
            };
        })(this));
    };
    return Calificaciones;
})();