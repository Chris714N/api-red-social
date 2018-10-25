'use strict'

var path = require('path'),
    fs = require('fs'),
    mongoosePaginate = require('mongoose-pagination')

var User = require('../models/user'),
    Follow = require('../models/follow')

function prueba(req, res){
    res.status(200).send({message:'Controlador follow funcionando'})
}

function saveFollow(req, res){
    var params = req.body

    var User = require('../models/user')
    var follow = new Follow()

    follow.user = req.user.sub
    follow.followed = params.followed
    // console.log('\x1b[36m%s\x1b[0m', 'Usuario:', follow.user)
    // console.log('\x1b[36m%s\x1b[0m', 'Seguir:', follow.followed)
    //Evitar auto Follow
    if(follow.followed == req.user.sub)
    {
        return res.status(200).send({message:'Usuario que desea seguir, no existe!!!'})
    }
    //verificar si ya sigo a usuario
    Follow.findOne({followed:follow.followed, user:follow.user},(err, follows)=>{
        if (err) return err
        if (follows){ //si lo sigo
            //console.log(follows)
            return res.status(200).send({message:'Ya sigues a este usuario'})
        }
        else{ 
            //console.log('\x1b[31m%s\x1b[0m', 'No sigue a este usuario')
            //verificar que usuario exista en la database.
            User.findOne({_id:follow.followed}, (err, user)=>{
                if (err) return err
                if(user){
                    follow.save((err, followStored)=>{
                        if(err) return res.status(500).send({message:'Error al guardar el documento'})
                        if(!followStored) return res.status(404).send({message:'El seguimiento no se ha guardado'})
                        return res.status(200).send({follow:followStored})
                    })
                }
                else{
                    return res.status(200).send({message:'Usuario que desea seguir, no existe'})
                }
            })
        }

    })
}

function deleteFollow(req, res){
    var userId = req.user.sub
    var followId = req.params.id
    Follow.find({'user':userId, 'followed':followId}).remove((err)=>{
        if(err) return res.status(500).send({message:'Error al dejar de seguir'})
        return res.status(200).send({message:'El follow se ha eliminado'})
    })
}

function getFollowUsers(req, res){
    var userId=req.user.sub

    if(req.params.id && req.params.page){
        userId = req.params.id
    }

    var page = 1

    if(req.params.page){
        page = req.params.page
    }else{
        page = req.params.id
    }

    var itemsPerPage = 4

    Follow.find({user:userId}).populate({path:'followed'}).paginate(page, itemsPerPage,(err, follows, total)=>{
        if(err) return res.status(500).send({message:'Error en el servidor'})
        if(!follows) return res.status(404).send({message:'No estas siguiendo a ningun usuario'})
        //user.password = undefined
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            follows
        })
    })
}

function getFollowedUsers(req, res){
    var userId=req.user.sub

    if(req.params.id && req.params.page){
        userId = req.params.id
    }

    var page = 1

    if(req.params.page){
        page = req.params.page
    }else{
        page = req.params.id
    }

    var itemsPerPage = 4

    Follow.find({followed:userId}).populate('user').paginate(page, itemsPerPage,(err, follows, total)=>{
        if(err) return res.status(500).send({message:'Error en el servidor'})
        if(!follows) return res.status(404).send({message:'No te sigue ningun usuario'})
        //follows.followed.password = undefined
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            follows
        })
    })
}
//Devolver usuarios listados, sin paginar
function getMyFollows(req, res){
    var userId = req.user.sub
    var find =  Follow.find({user: userId})

    if(req.params.followed){
        find =  Follow.find({followed: userId})
    }
    find.populate('user followed').exec((err, follows)=>{
        if(err) return res.status(500).send({message:'Error en el servidor'})
        if(!follows) return res.status(404).send({message:'No te sigue ningun usuario'})
        //follows.followed.password = undefined
        return res.status(200).send({ follows })
    })
}

module.exports = {
    prueba,
    saveFollow,
    deleteFollow,
    getFollowUsers,
    getFollowedUsers,
    getMyFollows
}