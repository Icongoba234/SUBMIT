const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agency.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All agency routes require authentication and agency role
router.use(authenticate);
router.use(authorize('agency'));

router.get('/info', agencyController.getMyAgency);
router.get('/complaints', agencyController.getAssignedComplaints);
router.patch('/status', agencyController.updateStatus);

module.exports = router;

