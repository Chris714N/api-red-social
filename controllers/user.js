'use strict'

var fs = require('fs')
var path = require('path')
var bcrypt = require('bcrypt-nodejs')
var jwt = require('../services/jwt')
var User = require('../models/user')
var Follow = require('../models/follow')
var Publication = require('../models/publication')
var mongoosePaginate = require('mongoose-pagination')

function home(req, res) {
    res.status(200).send({
        message1: 'Prueba en Servidor local de NodeJS. 1',
    })

}

function pruebas(req, res) {
    console.log(req.body)
    res.status(200).send({
        message4: ['Prueba en Servidor local de NodeJS. 4', 'Prueba en Servidor local de NodeJS. 5', 'Prueba en Servidor local de NodeJS. 6']
    })
}

function saveUser(req, res) {

    var params = req.body
    var user = new User()

    if (params.name && params.surname && params.nick && params.email && params.password) {
        user.name = params.name
        user.surname = params.surname
        user.nick = params.nick
        user.email = params.email
        user.role = 'ROLE_USER'
        user.image = null

        //Controlar usuarios duplicados.
        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err) return res.status(500).send({ message: 'Error en la peticion de usuarios' })
            if (users && users.length >= 1) {
                return res.status(200).send({ message: 'Usuario ya existe, registrar uno distinto' })
            }
            else {
                //Cifrar password y guardar datos en Database
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash
                    user.save((err, userStored) => {
                        if (err) return res.status(500).send({ message: 'Error al guardar el usuario' })

                        if (userStored) {
                            res.status(200).send({ user: userStored })
                        }
                        else {
                            res.status(404).send({ message: 'No se realizo el registro' })
                        }
                    })
                })

            }
        })
    }
    else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios'
        })
    }

}

function loginUser(req, res) {
    var params = req.body
    var email = params.email
    var password = params.password

    User.findOne({ email: email }, (err, user) => {
        if (err) return status(500).send({ message: 'Error en la petición' })
        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {
                    //devolver datos de usuarios
                    if (params.gettoken) {
                        //devolver y generar token
                        res.status(200).send({ token: jwt.createToken(user) })
                    }
                    else {
                        //delvolver datos en claro
                        user.password = undefined
                        return res.status(200).send({ user })
                    }
                }
                else {
                    return res.status(404).send({ message: 'Usuario no ha podido identificar' })
                }
            })
        }
        else {
            return res.status(404).send({ message: 'Usuario no ha podido identificar!!' })
        }
    })
}

//leer seguidores y seguidos de forma asincrona.
function getUser(req, res) {
    var userId = req.params.id

    User.findById(userId, (err, user) => {

        if (err) return res.status(500).send({ message: 'Error en la petición' })

        if (!user) return res.status(404).send({ message: 'Usuario no existe' })

        followedThisUser(req.user.sub, userId).then((value) => {
            return res.status(200).send({ user, value })
        })

        //var promiseFollowedThisUser = new Promise((resolve, reject)=>{
        //    Follow.findOne({"user":req.user.sub, "followed":userId}).exec((err, follows)=>{
        //        if(err) {reject ((err))}
        //        console.log('+++++', follows)
        //        resolve(follows) 
        //    })
        //})

        //promiseFollowedThisUser
        //    .then((following)=>{
        //        console.log('Promesa resuelta:', following)
        //        return new Promise((resolve, reject)=>{
        //            Follow.findOne({"user":userId, "followed":req.user.sub}).exec((err, followed)=>{
        //                if(err) {reject ((err))}
        //                console.log('+++++', followed)
        //                resolve({followed:followed, following:following}) 
        //            })
        //        })
        //    })
        //    .then((follows)=>{
        //        return res.status(200).send({user, follows})
        //    })
        //    .catch((err) => { 
        //        return res.status(404).send({message:'Error en consulta de datos'})
        //     })
    })
}

function followsThisUser(identity_user_id, user_id) {
    return new Promise(resolve => {
        Follow.findOne({ "user": identity_user_id, "followed": user_id }).exec((err, follows) => {
            if (err) { return handleError(err) }
            resolve(follows)
        })
    })
}

async function followedThisUser(identity_user_id, user_id) {
    var following = await followsThisUser(identity_user_id, user_id)
    var followed = await followsThisUser(user_id, identity_user_id)
    return {
        following: following,
        followed: followed
    }
}
//---------------------------------------------------

//devolver un listado de usuarios paginados
function getUsers(req, res) {
    var identityUserId = req.user.sub
    var page = 1
    if (req.params.page) {
        page = req.params.page
    }

    var itemsPerPage = 5

    User.find().sort('_id').select('_id name surname nick email image').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' })
        if (!users) return res.status(404).send({ message: 'No hay usuarios disponibles' })
        var following_clean = []
        var followed_clean = []

        var promiseFollowing = new Promise((resolve, reject) => {
            Follow.find({ 'user': identityUserId }).sort('_id').select({ '_id': 0, '__v': 0, 'user': 0 }).exec((err, follows) => {
                if (follows) {
                    resolve(follows)
                }
            })
        })

        promiseFollowing
            .then((data) => {
                return new Promise((resolve) => {
                    // Procesar Following ids
                    data.forEach((follow) => {
                        //console.log(follow.followed)
                        following_clean.push(follow.followed)
                    })
                    //console.log(following_clean)
                    resolve(following_clean)
                })
            })
            .then((following) => {
                return new Promise((resolve) => {
                    Follow.find({ 'followed': identityUserId }).sort('_id').select({ '_id': 0, '__v': 0, 'followed': 0 }).exec((err, follows) => {
                        if (follows) {
                            // Procesar Following ids
                            follows.forEach((follow) => {
                                //console.log(follow.followed)
                                followed_clean.push(follow.user)
                            })
                            //console.log(followed_clean)
                            //let obj = { following_clean, followed_clean }
                            //console.log(obj)
                            return res.status(200).send({
                                users,
                                users_following: following_clean,
                                users_follow_me: followed_clean,
                                total,
                                pages: Math.ceil(total / itemsPerPage)
                            })
                        }
                    })
                })
            })


    })
}



function FollowUserIds(user_id) {

    var following_clean = []
    var followed_clean = []

    var promiseFollowing = new Promise((resolve, reject) => {
        Follow.find({ 'user': user_id }).sort('_id').select({ '_id': 0, '__v': 0, 'user': 0 }).exec((err, follows) => {
            if (follows) {
                resolve(follows)
            }
        })
    })

    promiseFollowing
        .then((data) => {
            return new Promise((resolve) => {
                // Procesar Following ids
                data.forEach((follow) => {
                    //console.log(follow.followed)
                    following_clean.push(follow.followed)
                })
                //console.log(following_clean)
                resolve(following_clean)
            })
        })
        .then((following) => {
            return new Promise((resolve) => {
                Follow.find({ 'followed': user_id }).sort('_id').select({ '_id': 0, '__v': 0, 'followed': 0 }).exec((err, follows) => {
                    if (follows) {
                        // Procesar Following ids
                        follows.forEach((follow) => {
                            //console.log(follow.followed)
                            followed_clean.push(follow.user)
                        })
                        //console.log(followed_clean)
                        let obj = { following_clean, followed_clean }
                        console.log(obj)
                        resolve(obj)
                    }
                })
            })
        })

    // Procesar Followed ids
    // var followed_clean = []
    // followed.forEach((follow)=>{
    //     console.log(follow.user)
    //     followed_clean.push(follow.user)
    // })
    //console.log(follow_clean)
}

async function FollowsUserIds(user_id) {
    console.log('Enviando datos: ')
    var datos = await FollowUserIds(user_id)
    console.log(datos)
    return datos
}

//Edicion de datos de usuario
function updateUser(req, res) {
    var userId = req.params.id
    var update = req.body
    //console.log(update)
    //borrar propiedad password
    delete update.password
    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tienes permiso para actualizar datos' })
    }
    //Controlar usuarios duplicados
    User.count({
        $or: [
            { email: update.email },
            { nick: update.nick }
        ]
    }).exec((err, count) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion de usuarios' })
        if (count > 1) {
            return res.status(404).send({ message: 'Usuario ya existe, registrar uno distinto' })
        } else {
            User.findOne({ $or: [{ email: update.email }, { nick: update.nick }] }, (err, userMatch) => {
                if (err) return res.status(500).send({ message: 'Error en la peticion de usuarios' })
                if (!userMatch) {
                    User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
                        if (err) return res.status(500).send({ message: 'Error en la petición' })
                        if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' })
                        return res.status(200).send({ user: userUpdated })
                    })
                } else {
                    if (userMatch._id == req.user.sub) {
                        User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
                            if (err) return res.status(500).send({ message: 'Error en la petición' })
                            if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' })
                            return res.status(200).send({ user: userUpdated })

                        })
                    } else {
                        return res.status(404).send({ message: 'No se ha podido actualizar, usuario ya existe' })
                    }
                }

            })
        }
    })

}

//Contar Seguidores y seguidos de forma asincrona.
function getCounters(req, res) {
    var userId = req.user.sub
    if (req.params.id) {
        userId = req.params.id
    }

    getCountFollow(userId).then((value) => {
        //console.log('\x1b[33m%s\x1b[0m','Value: ', value)
        return res.status(200).send(value)
    })

}

function getCountersFollows(user_id, nameProperty) {
    return new Promise(resolve => {
        if (nameProperty == "user") {
            Follow.count({ "user": user_id }).exec((err, count) => {
                if (err) { return err }
                resolve(count)
            })
        }
        if (nameProperty == "followed") {
            Follow.count({ "followed": user_id }).exec((err, count) => {
                if (err) { return handleError(err) }
                resolve(count)
            })
        }
        if (nameProperty == "publications") {
            Publication.count({ "user": user_id }).exec((err, count) => {
                if (err) { return handleError(err) }
                resolve(count)
            })
        }

    })
}

async function getCountFollow(user_id) {
    var following = await getCountersFollows(user_id, 'user')
    var followed = await getCountersFollows(user_id, 'followed')
    var publications = await getCountersFollows(user_id, 'publications')
    return {
        following: following,
        followed: followed,
        publications: publications
    }
}
//-------------------------------------------
//Subir Imagen de Avatar
function uploadImage(req, res) {
    var userId = req.params.id

    if (req.files) {
        var file_path = req.files.image.path
        console.log(file_path)
        var file_split = file_path.split('\\')
        console.log(file_split)

        var file_name = file_split[2]
        var ext_split = file_name.split('\.')
        var file_ext = ext_split[1]

        if (userId != req.user.sub) {
            console.log('\x1b[31m%s\x1b[0m', 'Usuario:', req.user.sub)
            return removeFilesOfUploads(res, file_path, 'Usuario no tiene permisos para actualizar datos')
        }


        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
            //actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, userUpdated) => {
                if (err) return res.status(500).send({ message: 'Error en la petición' })
                if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' })
                console.log(userUpdated)
                return res.status(200).send({ user: userUpdated })
            })
        }
        else {
            return removeFilesOfUploads(res, file_path, 'Extensión no válida')
        }
    }
    else {
        return res.status(200).send({ message: 'No subio ninguna imagen' })
    }

}

//devoler imagen de usuario
function getImageFile(req, res) {
    var image_file = req.params.imageFile
    var path_file = './upload/users/' + image_file

    // console.log('\x1b[31m%s\x1b[0m', 'Archivo:', path_file)
    //Verificar que archivo corresponda a usuario

    fs.stat(path_file, (err, stat) => {
        if (err) {
            // console.log('\x1b[31m%s\x1b[0m', 'Error:', err)
            return res.status(200).send({ message: 'Fichero no existe' })
        }
        else {
            // console.log('No hay error')
            if (stat) {
                // console.log('stat devuelve datos')
                // console.log('\x1b[33m%s\x1b[0m', JSON.stringify(stat))
                return res.sendFile(path.resolve(path_file))
            }
        }
    })
}

function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({ message: message })
    })
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    getCounters,
    uploadImage,
    getImageFile
}