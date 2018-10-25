'use strict'

var mongoose = require('mongoose')
var app = require('./app')
var port = process.env.PORT || 3800

// Conexion Database
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/curso_mean_social')
        .then(()=>{
            console.log('\x1b[32m%s\x1b[0m', 'La conexion a la base de datos curso_mean_social se realizo correctamente!')

            //Crear servidor
            app.listen(port, ()=>{
                console.log('\x1b[32m%s\x1b[0m', 'Servidor Corriento en http://localhost:3800')
            })
        })
        .catch((err)=>{console.log(err)})
