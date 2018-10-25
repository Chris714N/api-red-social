'use strict'

var moment = require('moment')
var mongoosePaginate = require('mongoose-pagination')

var User = require('../models/user')
var Follow = require('../models/follow')
var Message = require('../models/message')

function probandoM(req, res){
    res.status(200).send({message:'Hola desde mensajes'})
}

function saveMessage(req, res){
    var params = req.body

    if(!params.text || !params.receiver){
        return res.status(200).send({message:'Enviar campos necesarios'})
    }
    var message = new Message()
    message.emitter = req.user.sub
    message.receiver = params.receiver
    message.text = params.text
    message.viewed = 'false'
    message.created_at = moment().unix()

    message.save((err, messageStore)=>{
        if(err) return res.status(500).send({message:'Error en la peticion'})
        if(!messageStore) return res.status(500).send({message:'Error al enviar el mensaje'})

        return res.status(200).send({message:messageStore})
    })


}

function getReceiverMessages(req, res){
    var userId = req.user.sub
    
    var page = 1
    if(req.params.page){
        page = req.params.page
    }

    var itemsPerPage = 4

    Message.find({receiver: userId}).populate('emitter', 'name surname _id image nick').paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message:'Error en la peticion'})
        if(!messages) return res.status(404).send({message:'No hay mensajes'})

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            page: page,
            messages
        })
    })
}

function getEmmitMessages(req, res){
    var userId = req.user.sub
    
    var page = 1
    if(req.params.page){
        page = req.params.page
    }

    var itemsPerPage = 4

    Message.find({emitter: userId}).populate('emitter receiver', 'name surname _id image nick').paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message:'Error en la peticion'})
        if(!messages) return res.status(404).send({message:'No hay mensajes'})

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            page: page,
            messages
        })
    })
}

function getUnViewedMessages(req, res){
    var userId = req.user.sub
    Message.count({receiver:userId, viewed:'false'},(err, count)=>{
        if(err) return res.status(500).send({message:'Error en la peticion'})
        return res.status(200).send({
            'unviewed':count
        })
    })
}

//actualizar documento cuando se lea mensaje
function setUnViewedMessages(req, res){
    var userId = req.user.sub
    
    Message.update({receiver:userId, viewed:'false'}, {viewed:'true'}, {"multi":true}, (err, messageUpdated)=>{
        if(err) return res.status(500).send({message:'Error en la peticion'})
        return res.status(200).send({
            messages:messageUpdated
        })
    })
}


module.exports = {
    probandoM,
    saveMessage,
    getReceiverMessages,
    getEmmitMessages,
    getUnViewedMessages,
    setUnViewedMessages
}