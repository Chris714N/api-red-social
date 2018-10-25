'use strict'

var express = require('express')
var MessageController = require('../controllers/message')
var api = express.Router()
var md_auth = require('../middlewares/authenticated')

api.get('/probando-md', md_auth.ensureAuth, MessageController.probandoM)
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage)
api.get('/my-messages/:page?', md_auth.ensureAuth, MessageController.getReceiverMessages)
api.get('/messages/:page?', md_auth.ensureAuth, MessageController.getEmmitMessages)
api.get('/unviewed-messages/', md_auth.ensureAuth, MessageController.getUnViewedMessages)
api.get('/set-viewed-messages/', md_auth.ensureAuth, MessageController.setUnViewedMessages)

module.exports = api