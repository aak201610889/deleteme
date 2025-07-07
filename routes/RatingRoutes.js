const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Routes
router.post('/', ratingController.addRating);        
router.get('/',verifyToken("***"), ratingController.getRatings);        
router.delete('/:id',verifyToken("***"), ratingController.deleteRating); // Delete a ratingorder

module.exports = router;
