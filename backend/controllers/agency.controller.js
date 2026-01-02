const db = require('../db');

// Get agency information for the logged-in agency user
const getMyAgency = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's agency_id
    const [users] = await db.execute(
      'SELECT agency_id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].agency_id) {
      return res.status(404).json({
        success: false,
        message: 'Agency not linked to this user. Please contact administrator.'
      });
    }

    const agencyId = users[0].agency_id;

    // Get agency details
    const [agencies] = await db.execute(
      'SELECT id, name, email, created_at FROM agencies WHERE id = ?',
      [agencyId]
    );

    if (agencies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    res.json({
      success: true,
      data: {
        agency: agencies[0]
      }
    });
  } catch (error) {
    console.error('Get my agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agency information',
      error: error.message
    });
  }
};

// Get complaints assigned to this agency
const getAssignedComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's agency_id from the users table
    const [users] = await db.execute(
      'SELECT agency_id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].agency_id) {
      return res.status(404).json({
        success: false,
        message: 'Agency not linked to this user. Please contact administrator.'
      });
    }

    const agencyId = users[0].agency_id;

    // Get complaints assigned to this agency
    const [complaints] = await db.execute(
      `SELECT c.*, 
       u.fullname as user_name, 
       u.email as user_email,
       a.name as agency_name
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       JOIN agencies a ON c.assigned_agency_id = a.id
       WHERE c.assigned_agency_id = ? 
       ORDER BY c.created_at DESC`,
      [agencyId]
    );

    res.json({
      success: true,
      data: {
        complaints,
        count: complaints.length
      }
    });
  } catch (error) {
    console.error('Get assigned complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned complaints',
      error: error.message
    });
  }
};

// Update complaint status (agency can only update to resolved)
const updateStatus = async (req, res) => {
  try {
    const { complaintId, status } = req.body;
    const userId = req.user.id;

    if (!complaintId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID and status are required'
      });
    }

    // Agency can only set status to 'in_review' or 'resolved'
    const validStatuses = ['in_review', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Agency can only set status to: ${validStatuses.join(' or ')}`
      });
    }

    // Get user's agency_id from the users table
    const [users] = await db.execute(
      'SELECT agency_id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].agency_id) {
      return res.status(404).json({
        success: false,
        message: 'Agency not linked to this user. Please contact administrator.'
      });
    }

    const agencyId = users[0].agency_id;

    // Verify complaint is assigned to this agency
    const [complaints] = await db.execute(
      'SELECT id, status FROM complaints WHERE id = ? AND assigned_agency_id = ?',
      [complaintId, agencyId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to your agency'
      });
    }

    // Update status
    await db.execute(
      'UPDATE complaints SET status = ? WHERE id = ?',
      [status, complaintId]
    );

    // Fetch updated complaint
    const [updatedComplaints] = await db.execute(
      `SELECT c.*, 
       u.fullname as user_name, 
       u.email as user_email,
       a.name as agency_name
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       LEFT JOIN agencies a ON c.assigned_agency_id = a.id
       WHERE c.id = ?`,
      [complaintId]
    );

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      data: {
        complaint: updatedComplaints[0]
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

module.exports = {
  getMyAgency,
  getAssignedComplaints,
  updateStatus
};

