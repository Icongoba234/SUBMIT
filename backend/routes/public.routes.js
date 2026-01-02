const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Public routes (no authentication required)
router.get('/stats', publicController.getPublicStats);
router.get('/complaints', publicController.getPublicComplaints);
router.get('/agencies/performance', publicController.getAgencyPerformance);
router.get('/categories/trending', publicController.getTrendingCategories);

module.exports = router;

