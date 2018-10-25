'use strict'

var jwt = require('jwt-simple')
var moment = require('moment')
var secret = 'Clave_secreta_generada_para_token_de_usuarios_privada_1990.'

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({
            message: 'La petición no contiene la cabecera de autentificación'
        })
    }

    var token = req.headers.authorization.replace(/['"]+/g,'')

    try{
        var payload = jwt.decode(token, secret)
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                message: 'Token experido'
            })
        }
    }
    catch(ex){
        return res.status(404).send({
            message: 'Token no válido'
        })
    }

    req.user = payload
    //console.log('Payload: ', payload)
    next()


}

exports.ensureAuthId = function(req, res, next){
    var userId = req.params.id

    if(!req.headers.authorization){
        return res.status(403).send({
            message: 'La petición no contiene la cabecera de autentificación'
        })
    }

    var token = req.headers.authorization.replace(/['"]+/g,'')

    try{
        var payload = jwt.decode(token, secret)
        //Comprobar ID
        if(!userId){
            return res.status(401).send({
                message: 'No contiene ID de usuario'
            })
        }
        else{
            if(payload.sub !=  userId){
                return res.status(401).send({
                    message: 'ID de usuario no concuerda'
                })
            }
        }
        //Comprobar fecha
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                message: 'Token experido'
            })
        }
        
    }
    catch(ex){
        return res.status(404).send({
            message: 'Token no válido'
        })
    }

    req.user = payload
    
    next()


}