const db = require('../db');

// Get all complaints (admin view)
const getAllComplaints = async (req, res) => {
  try {
    const [complaints] = await db.execute(
      `SELECT c.*, 
       u.fullname as user_name, 
       u.email as user_email,
       a.name as agency_name,
       a.id as agency_id
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       LEFT JOIN agencies a ON c.assigned_agency_id = a.id
       ORDER BY c.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        complaints,
        count: complaints.length
      }
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  }
};

// Assign complaint to agency
const assignComplaint = async (req, res) => {
  try {
    const { complaintId, agencyId } = req.body;

    if (!complaintId || !agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID and Agency ID are required'
      });
    }

    // Verify complaint exists
    const [complaints] = await db.execute(
      'SELECT id, status FROM complaints WHERE id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Verify agency exists
    const [agencies] = await db.execute(
      'SELECT id FROM agencies WHERE id = ?',
      [agencyId]
    );

    if (agencies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Update complaint
    await db.execute(
      'UPDATE complaints SET assigned_agency_id = ?, status = ? WHERE id = ?',
      [agencyId, 'in_review', complaintId]
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
      message: 'Complaint assigned to agency successfully',
      data: {
        complaint: updatedComplaints[0]
      }
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign complaint',
      error: error.message
    });
  }
};

// Update complaint status (admin)
const updateStatus = async (req, res) => {
  try {
    const { complaintId, status } = req.body;

    if (!complaintId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID and status are required'
      });
    }

    const validStatuses = ['pending', 'in_review', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify complaint exists
    const [complaints] = await db.execute(
      'SELECT id FROM complaints WHERE id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
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

// Get all agencies (for admin dropdown)
const getAllAgencies = async (req, res) => {
  try {
    const [agencies] = await db.execute(
      'SELECT id, name, email, created_at FROM agencies ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: {
        agencies,
        count: agencies.length
      }
    });
  } catch (error) {
    console.error('Get all agencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agencies',
      error: error.message
    });
  }
};

module.exports = {
  getAllComplaints,
  assignComplaint,
  updateStatus,
  getAllAgencies
};

