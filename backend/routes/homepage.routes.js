const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepage.controller');

// Public routes (no authentication required)
router.get('/stats', homepageController.getHomepageStats);
router.get('/trending-issues', homepageController.getTrendingIssues);
router.get('/success-stories', homepageController.getSuccessStories);

module.exports = router;

