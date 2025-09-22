

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

    // UPDATE QUERIES

    // 1. Add a new field "available_on" with the value "Sflix" to "The Matrix".
    const setAvailableOn = await Movie.updateOne(
      { title: 'The Matrix' },
      { $set: { available_on: 'Sflix' } }
    );
    console.log('Set available_on for The Matrix ->', setAvailableOn.modifiedCount, 'document(s)');

    // 2. Increment the metacritic of "The Matrix" by 1.
    const incMetacritic = await Movie.updateOne(
      { title: 'The Matrix' },
      { $inc: { metacritic: 1 } }
    );
    console.log('Incremented metacritic for The Matrix ->', incMetacritic.modifiedCount, 'document(s)');

    // 3. Add a new genre "Gen Z" to all movies released in the year 1997.
    const addGenreFor1997 = await Movie.updateMany(
      { year: 1997 },
      { $addToSet: { genres: 'Gen Z' } }
    );
    console.log('Added "Gen Z" to 1997 movies ->', addGenreFor1997.modifiedCount, 'document(s)');

    // 4. Increase IMDb rating by 1 for all movies with a rating less than 5.
    const bumpLowImdb = await Movie.updateMany(
      { 'imdb.rating': { $lt: 5 } },
      { $inc: { 'imdb.rating': 1 } }
    );
    console.log('Increased low IMDb ratings ->', bumpLowImdb.modifiedCount, 'document(s)');

    // DELETE QUERIES

    // 1. Delete a comment with a specific ID (uses env COMMENT_ID if provided; otherwise deletes the first found comment).
    let commentIdToDelete = process.env.COMMENT_ID;
    if (!commentIdToDelete) {
      const anyComment = await Comment.findOne({}, { _id: 1 });
      commentIdToDelete = anyComment?._id?.toString();
    }
    if (commentIdToDelete) {
      const delOneComment = await Comment.deleteOne({ _id: commentIdToDelete });
      // Remove any references from movies.comments arrays
      await Movie.updateMany(
        { comments: commentIdToDelete },
        { $pull: { comments: commentIdToDelete } }
      );
      console.log('Deleted comment by ID ->', commentIdToDelete, '| deleted count:', delOneComment.deletedCount);
    } else {
      console.log('No comment found/provided to delete. Skipping specific-ID delete.');
    }

    // 2. Delete all comments made for "The Matrix".
    const theMatrix = await Movie.findOne({ title: 'The Matrix' }, { _id: 1, comments: 1 });
    if (theMatrix) {
      const delMatrixComments = await Comment.deleteMany({ movie: theMatrix._id });
      // Clear refs on the movie document
      theMatrix.comments = [];
      await theMatrix.save();
      console.log('Deleted comments for The Matrix ->', delMatrixComments.deletedCount, 'comment(s)');
    } else {
      console.log('Movie "The Matrix" not found. Skipping delete of its comments.');
    }

    // 3. Delete all movies that do not have any genres.
    const deleteNoGenreMovies = await Movie.deleteMany({ $or: [
      { genres: { $exists: false } },
      { genres: { $size: 0 } },
      { genres: null }
    ] });
    console.log('Deleted movies with no genres ->', deleteNoGenreMovies.deletedCount, 'movie(s)');

    // AGGREGATE QUERIES

    // 1. Aggregate movies to count how many were released each year and display from earliest to latest.
    const moviesPerYear = await Movie.aggregate([
      { $match: { year: { $type: 'number' } } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, year: '$_id', count: 1 } },
    ]);
    console.log('Movies released per year (earliest->latest):', moviesPerYear);

    // 2. Average IMDb rating for movies grouped by director, highest to lowest.
    const avgImdbByDirector = await Movie.aggregate([
      { $match: { director: { $ne: null }, 'imdb.rating': { $type: 'number' } } },
      { $group: { _id: '$director', avgRating: { $avg: '$imdb.rating' }, count: { $sum: 1 } } },
      { $project: { _id: 0, director: '$_id', avgRating: { $round: ['$avgRating', 2] }, count: 1 } },
      { $sort: { avgRating: -1, director: 1 } },
    ]);
    console.log('Average IMDb rating by director (desc):', avgImdbByDirector);
  } catch (err) {
    console.error(err);
  } finally {
    await require('mongoose').connection.close();
  }
};

runDatabaseQueries();