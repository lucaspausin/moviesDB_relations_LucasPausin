const path = require('path');
const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment')


//Aqui tienen una forma de llamar a cada uno de los modelos
// const {Movies,Genres,Actor} = require('../database/models');

//Aquí tienen otra forma de llamar a los modelos creados
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;


const moviesController = {
    'list': (req, res) => {
        db.Movie.findAll({
            include: ['genre']
        })
            .then(movies => {
                res.render('moviesList.ejs', {movies})
            })
    },
    'detail': (req, res) => {
        db.Movie.findByPk(req.params.id,{
            include: ['actors']
        })
            .then(movie => {
                res.render('moviesDetail.ejs', {movie});
            });
    },
    'new': (req, res) => {
        db.Movie.findAll({
            order : [
                ['release_date', 'DESC']
            ],
            limit: 5
        })
            .then(movies => {
                res.render('newestMovies', {movies});
            });
    },
    'recomended': (req, res) => {
        db.Movie.findAll({
            where: {
                rating: {[db.Sequelize.Op.gte] : 8}
            },
            order: [
                ['rating', 'DESC']
            ]
        })
            .then(movies => {
                res.render('recommendedMovies.ejs', {movies});
            });
    },
    //Aqui dispongo las rutas para trabajar con el CRUD
    add: function (req, res) {
        const genres = db.Genre.findAll({
            order: ['name']
        })
        const actors = db.Actor.findAll({
            order: [
                ['first_name'],
                ['last_name']
            ]
        })
        Promise.all([actors,genres]).then(([actors,genres])=>{
            return res.render("moviesAdd",{
                genres,
                actors
            })
        })
        .catch(error => console.log(error))
    },
    create: function (req,res) {
            const {title, rating, release_date, awards, length, genre_id} = req.body
            const actors = [req.body.actors].flat();
            db.Movie.create({
                title: title.trim(),
                rating, 
                release_date,
                awards,
                length,
                genre_id,
                image: req.file ? req.file.filename : null
            })
                .then((movie) => {
                    if(actors){
                        const actorsDB = actors.map(actor => {
                            return {
                                movie_id: movie.id,
                                actor_id: actor
                            }
                        })
                        db.Actor_Movie.bulkCreate(actorsDB,{
                            validate: true
                        }).then(()=>{
                            console.log('Actores agregados')
                            return res.redirect('/movies')
                        })
                    } else {
                        return res.redirect('/movies')
                    }
                })
                .catch(error => console.log(error))
    },
    edit: function(req,res) {
        const genres = db.Genre.findAll({
            order: ['name']
        })
        const Movie = db.Movie.findByPk(req.params.id,{
            include: ['genre'],
            include: ['actors']
        })
        const actors = db.Actor.findAll({
            order: [
              ['first_name','ASC'],
              ['last_name','ASC']
            ]
          })
        Promise.all([genres, Movie, actors])
        .then(([genres, Movie, actors]) => {
            return res.render('moviesEdit',{
                genres,
                Movie,
                actors
            })
        })
        .catch(error => console.log(error))
    },
    update: function (req,res) {
        // TODO
        let {title, rating, release_date, awards, length, genre_id,actors} = req.body;
        actors = typeof actors === "string" ? [actors] : actors
            db.Movie.update(
                {
                    title: title.trim(),
                    rating, 
                    release_date,
                    awards,
                    length,
                    genre_id,
    
                },
                {
                    where:{
                        id: req.params.id
                    }
                }
            )
                .then(() => {
                    db.Actor_Movie.destroy({
                        where: {
                            movie_id: req.params.id
                        }
                    }).then(() => {
                        if(actors){
                            const actorsDB = actors.map(actor => {
                                return {
                                    movie_id: req.params.id,
                                    actor_id: actor
                                }
                            })
                            db.Actor_Movie.bulkCreate(actorsDB,{
                                validate: true
                            }).then(()=>{
                                console.log('Actores agregados')
                            })
                        } 
                    }).catch(error => console.log(error))
                })
                .catch(error => console.log(error))
                .finally(() => {
                    return res.redirect('/movies')
                })
       
    },
    delete: function (req,res) {
        db.Movie.findByPk(req.params.id)
        .then(movie => {
            return res.render('moviesDelete',{
                    Movie: movie
            })
        })

    },
    destroy: function (req,res) {
        db.Actor_Movie.destroy({
            where:{
                movie_id: req.params.id
            }
        }).then(() => {
            db.Actor.update({
                favorite_movie_id: null
            },{
                where:{
                    favorite_movie_id: req.params.id
                }
            })
        }).then(() => {
            db.Movie.destroy({
                where : {
                    id : req.params.id
                }
            }).then(movie => {
                console.log(movie)
                return res.redirect('/movies')
            })
        })
        .catch((error) => console.log(error))
        
    }
}

module.exports = moviesController;