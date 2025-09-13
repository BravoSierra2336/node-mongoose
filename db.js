const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const movieSchema = new mongoose.Schema({
  title: String,
  director: String,
  year: Number,
  genres: [String],
  imdb: {
    rating: Number,
    votes: Number,
  },
  metacritic: Number,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  available_on: String,
  cast: [String],
});

const commentSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  text: String,
  author: String,
});

module.exports = {
  userSchema,
  movieSchema,
  commentSchema,
};