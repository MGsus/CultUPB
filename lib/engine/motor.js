var Motor, Calificaciones, Similitud, Recomendaciones, async;

async = require('async');

Calificaciones = require('./calificaciones');

Similitud = require('./similitud');

Recomendaciones = require('./recomendaciones');

module.exports = Motor = (function () {
    function Motor() {
        this.likes = new Calificaciones(this, 'likes');
        this.dislikes = new Calificaciones(this, 'dislikes');
        this.similitud = new Similitud(this);
        this.recomendaciones = new Recomendaciones(this);
    }

    return Motor;

})();