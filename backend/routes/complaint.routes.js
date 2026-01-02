const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/complaint-upload.middleware');

// All complaint routes require authentication
router.use(authenticate);

router.post('/', upload.array('files', 10), complaintController.submitComplaint);
router.get('/my', complaintController.getMyComplaints);
router.get('/export', complaintController.exportComplaints);
router.get('/updates', complaintController.getRealtimeUpdates);
router.post('/:id/updates', complaintController.addComplaintUpdate);
router.get('/:id', complaintController.getComplaintDetails);

module.exports = router;

