'use strict'

var jwt = require('jwt-simple')
var moment = require('moment')
var secret = 'Clave_secreta_generada_para_token_de_usuarios_privada_1990.'

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix
    }

    return jwt.encode(payload, secret)
}