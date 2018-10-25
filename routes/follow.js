'use strict'

var express = require('express'),
    FollowController = require('../controllers/follow'),
    api = express.Router(),
    md_auth = require('../middlewares/authenticated')

api.post('/follow/', md_auth.ensureAuth, FollowController.saveFollow)
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow)
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowUsers)
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers)
api.get('/get-my-follow/:followed?', md_auth.ensureAuth, FollowController.getMyFollows)

module.exports = api