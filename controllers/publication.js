'use strict'

var path = require('path')
var fs = require('fs')
var moment = require('moment')
var mongoosePaginate = require('mongoose-pagination')

//Modelos
var Publication = require('../models/publication'),
    User = require('../models/user'),
    Follow = require('../models/follow')

function probando(req, res) {
    return res.status(200).send({
        message: 'hola desde el CONTROLADOR DE PUBLICACIONES'
    })
}

function savePublication(req, res) {
    var params = req.body
    if (!params.text) return res.status(200).send({ message: 'Debes enviar un texto' })
    var publication = new Publication()

    publication.text = params.text
    publication.file = 'null'
    publication.user = req.user.sub
    publication.created_at = moment().unix()

    publication.save((err, publicationStored) => {
        if (err) return res.status(500).send({ message: 'Error al guardar la publicacion' })
        if (!publicationStored) return res.status(404).send({ message: 'La publicacion NO ha sido guardada' })
        return res.status(200).send({ publication: publicationStored })

    })

}

function getPublications(req, res) {
    //recoger id de usuario
    //Hacer find de usuario que sigo
    //Buscas y devolver publicaciones de usuario

    var page = 1
    if (req.params.page) {
        page = req.params.page
    }
    var itemPerPage = 5

    Follow.find({ user: req.user.sub }).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'Error en devolucion de seguimiento' })

        var follows_clean = []
        follows.forEach((follow) => {
            follows_clean.push(follow.followed)
        })
        follows_clean.push(req.user.sub)
        //return res.status(200).send({message:follows_clean})
        Publication.find({ user: { "$in": follows_clean } }).sort('-created_at').populate('user').paginate(page, itemPerPage, (err, publications, total) => {
            if (err) return res.status(500).send({ message: 'Error en devolucion de publicacion' })
            if (err) return res.status(404).send({ message: 'No hay publicacion' })
            publications.forEach((publication)=>{
                publication.user.password = undefined;
                publication.user.__v = undefined;
                publication.__v = undefined;
            })
            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemPerPage),
                page: page,
                items_per_page: publications.length,
                publications 
            })

        })

    })
}

function getMyPublications(req, res) {
    //recoger id de usuario
    //Buscas y devolver mis publicaciones

    var page = 1
    if (req.params.page) {
        page = req.params.page
    }
    var itemPerPage = 10


    
    Publication.find({ user: req.user.sub }).sort('-created_at').populate('user').paginate(page, itemPerPage, (err, publications, total) => {
        if (err) return res.status(500).send({ message: 'Error en devolucion de publicacion' })
        if (err) return res.status(404).send({ message: 'No hay publicacion' })
        return res.status(200).send({
            total_items: total,
            pages: Math.ceil(total / itemPerPage),
            page: page,
            publications
        })

    })

}

function getPublication(req, res) {
    var publicationId = req.params.id
    Publication.findById(publicationId, (err, publication) => {
        if (err) return res.status(500).send({ message: 'Error en devolucion de publicacion' })
        if (!publication) return res.status(404).send({ message: 'No existe la publicacion' })
        return res.status(200).send({ publication })
    })

}

function deletePublication(req, res) {
    var publicationId = req.params.id

    Publication.findOne({ 'user': req.user.sub, '_id': publicationId }, (err, userPermission) => {
        if (err) return res.status(500).send({ message: 'Error al buscar peticion' })
        if (!userPermission) return res.status(500).send({ message: 'No existen coincidencias' })

        Publication.deleteOne({ 'user': req.user.sub, '_id': publicationId }, (err, publicationRemoved) => {
            if (err) return res.status(500).send({ message: 'Error al borrar publicacion' })
            if (!publicationRemoved) return res.status(404).send({ message: 'No se borró publicación' })
            return res.status(200).send({ message: 'Publicacion ' + publicationId + ' eliminada' })
        })

    })
}

function uploadImage(req, res) {
    var publicationId = req.params.id


    if (req.files) {
        var file_path = req.files.image.path
        console.log(file_path)
        var file_split = file_path.split('\\')
        console.log(file_split)

        var file_name = file_split[2]
        var ext_split = file_name.split('\.')
        var file_ext = ext_split[1]

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {

            Publication.findOne({ 'user': req.user.sub, '_id': publicationId }, (err, publication) => {
                if (err) return res.status(500).send({ message: 'Error al subir archivo' })
                console.log(publication)
                if (publication) {
                    //actualizar documento de usuario logueado
                    Publication.findByIdAndUpdate(publicationId, { file: file_name }, { new: true }, (err, publicationUpdated) => {
                        if (err) return status(500).send({ message: 'Error en la petición' })
                        if (!publicationUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' })

                        return res.status(200).send({ publication: publicationUpdated })

                    })
                }
                else {
                    return removeFilesOfUploads(res, file_path, 'No tienes permisos para actualizar publicacion')
                }
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

//devoler imagen de publicacion
function getImageFile(req, res) {
    var image_file = req.params.imageFile
    var path_file = './upload/publication/' + image_file

    //console.log('\x1b[31m%s\x1b[0m', 'Archivo:', path_file)
    //Verificar que archivo corresponda a usuario
    if (image_file != req.user.image) {
        //console.log('\x1b[31m%s\x1b[0m', 'Imagen Solicita:', image_file)
        //console.log('\x1b[31m%s\x1b[0m', 'Imagen BD user:', req.user.image)
        return res.status(200).send({ message: 'Imagen solicitada no corresponde a usuario' })
    }

    fs.stat(path_file, (err, stat) => {
        if (err) {
            //console.log('\x1b[31m%s\x1b[0m', 'Error:', err)
            return res.status(200).send({ message: 'Fichero no existe' })
        }
        else {
            console.log('No hay error')
            if (stat) {
                //console.log('stat devuelve datos')
                //console.log('\x1b[33m%s\x1b[0m', JSON.stringify(stat))
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
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}