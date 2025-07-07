const Rating = require('../models/Rating');

const logger =require("../middlewares/logger")
exports.addRating = async (req, res) => {
  try {
    const { userphoneNumber, rating, comment } = req.body;
    logger.info('Attempting to add a new rating', { userphoneNumber, rating });

    // // Validation: Ensure user hasn't already rated
    // const existingRating = await Rating.findOne({ userphoneNumber });
    // if (existingRating) {
    //   logger.warn('User has already rated', { userphoneNumber });

    //   return res.status(400).json({ message: 'You have already rated.' });
    // }

    const newRating = new Rating({ userphoneNumber, rating, comment });
    await newRating.save();
    logger.info('Rating added successfully', { rating: newRating });

    res.status(201).json({ message: 'Rating added successfully', rating: newRating });
  } catch (error) {
    logger.error('Error adding rating', { error: error.message });

    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};




// Get all ratings by phone number
exports.getRatings = async (req, res) => {
  try {
    logger.info('Fetching all ratings');


    const ratings = await Rating.find().sort({ createdAt: -1 });

    if (!ratings.length) {
      logger.warn('No ratings found');

      return res.status(404).json({ message: 'No ratings found ' });
    }
    logger.info('Ratings fetched successfully');

    res.status(200).json({ ratings });
  } catch (error) {
    logger.error('Error fetching ratings', { error: error.message });

    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



// Get all ratings by phone number
exports.getRatingsByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    logger.info('Fetching ratings by phone number', { phoneNumber });

    const ratings = await Rating.find({ userphoneNumber: phoneNumber });
    if (!ratings.length) {
      logger.warn('No ratings found for this phone number', { phoneNumber });

      return res.status(404).json({ message: 'No ratings found for this phone number' });
    }
    logger.info('Ratings fetched successfully by phone number', { phoneNumber });

    res.status(200).json({ ratings });
  } catch (error) {
    logger.error('Error fetching ratings by phone number', { error: error.message });

    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update a rating
exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    logger.info('Updating rating', { id, rating });

    const updatedRating = await Rating.findByIdAndUpdate(
      id,
      { rating, comment },
      { new: true }
    );

    if (!updatedRating) {
      logger.warn('Rating not found for update', { id });

      return res.status(404).json({ message: 'Rating not found' });
    }
    logger.info('Rating updated successfully', { rating: updatedRating });

    res.status(200).json({ message: 'Rating updated successfully', rating: updatedRating });
  } catch (error) {
    logger.error('Error updating rating', { error: error.message });

    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a rating
exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Attempting to delete rating', { id });

    const deletedRating = await Rating.findByIdAndDelete(id);
    if (!deletedRating) {
      logger.warn('Rating not found for deletion', { id });

      return res.status(404).json({ message: 'Rating not found' });
    }
    logger.info('Rating deleted successfully', { id });

    res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error) {
    logger.error('Error deleting rating', { error: error.message });

    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
