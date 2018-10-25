'use strict'

var express = require('express')
var bodyParser = require('body-parser')

var app = express()
//seguridad

var helmet = require('helmet')
var limiter = require('express-limiter')(app)

// Cargar rutas
var user_routes = require('./routes/user')
var follow_routes = require('./routes/follow')
var publication_routes = require('./routes/publication')
var message_routes = require('./routes/message')

//Scripts
limiter({
    lookup: ['connection.remoteAddress'],
    // 600 requests per hour
    total: 600,
    expire: 1000 * 60 * 60
})

// Cargar Middlewares
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(helmet())

// cors
// configurar cabeceras http
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

// rutas
app.use('/api',user_routes)
app.use('/api',follow_routes)
app.use('/api',publication_routes)
app.use('/api',message_routes)

// exportar
module.exports = app