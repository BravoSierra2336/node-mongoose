

require('dotenv').config();
const mongoose = require('mongoose');
const { userSchema, movieSchema, commentSchema } = require('./db');

mongoose.connect(process.env.MONGO_URI);

const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);
const Comment = mongoose.model('Comment', commentSchema);

const runDatabaseQueries = async () => {
  try {
    // CREATE: Insert a new user document
    const newUser = new User({
      name: 'John Doe',
      email: 'john.doe@example.com',
    });
    await newUser.save();
    console.log('New user inserted:', newUser);

    // READ QUERIES

    // 1. Find all movies directed by Christopher Nolan.
    const nolanMovies = await Movie.find({ director: 'Christopher Nolan' });
    console.log('Movies directed by Christopher Nolan:', nolanMovies);

    // 2. Find movies that include the genre "Action" and sort (descending) them by year.
    const actionMovies = await Movie.find({ genres: 'Action' }).sort({ year: -1 });
    console.log('Action movies sorted by year:', actionMovies);

    // 3. Find movies with an IMDb rating greater than 8 and return only the title and IMDB information.
    const highRatedMovies = await Movie.find({ 'imdb.rating': { $gt: 8 } }, { title: 1, imdb: 1 });
    console.log('Movies with IMDb rating > 8:', highRatedMovies);

    // 4. Find movies that starred both "Tom Hanks" and "Tim Allen".
    const hanksAllenMovies = await Movie.find({ cast: { $all: ['Tom Hanks', 'Tim Allen'] } });
    console.log('Movies starring Tom Hanks and Tim Allen:', hanksAllenMovies);

    // 5. Find movies that starred both and only "Tom Hanks" and "Tim Allen".
    const hanksAllenOnlyMovies = await Movie.find({ cast: { $all: ['Tom Hanks', 'Tim Allen'], $size: 2 } });
    console.log('Movies starring ONLY Tom Hanks and Tim Allen:', hanksAllenOnlyMovies);

    // 6. Find comedy movies that are directed by Steven Spielberg.
    const spielbergComedyMovies = await Movie.find({ genres: 'Comedy', director: 'Steven Spielberg' });
    console.log('Comedy movies directed by Steven Spielberg:', spielbergComedyMovies);
  } catch (err) {
    console.error(err);
  } finally {
    await require('mongoose').connection.close();
  }
};

runDatabaseQueries();