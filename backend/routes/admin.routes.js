const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/complaints', adminController.getAllComplaints);
router.post('/assign', adminController.assignComplaint);
router.patch('/status', adminController.updateStatus);
router.get('/agencies', adminController.getAllAgencies);

module.exports = router;

