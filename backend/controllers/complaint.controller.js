const db = require('../db');

// Submit a new complaint
const submitComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, location, affected_area } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Generate tracking number
    const [countResult] = await db.execute('SELECT COUNT(*) as count FROM complaints');
    const nextId = countResult[0].count + 1;
    const trackingNumber = `CV-2025-${String(nextId).padStart(6, '0')}`;

    // Insert complaint with all details
    const [result] = await db.execute(
      `INSERT INTO complaints (user_id, tracking_number, title, description, category, priority, location, affected_area, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, trackingNumber, title, description, category || null, priority || 'medium', location || null, affected_area || null, 'pending']
    );

    const complaintId = result.insertId;

    // Save uploaded files
    const savedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `/uploads/complaints/${file.filename}`;
        const [fileResult] = await db.execute(
          `INSERT INTO complaint_files (complaint_id, file_path, file_name, file_type, file_size) 
           VALUES (?, ?, ?, ?, ?)`,
          [complaintId, filePath, file.originalname, file.mimetype, file.size]
        );
        savedFiles.push({
          id: fileResult.insertId,
          file_path: filePath,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_size: file.size
        });
      }
    }

    // Fetch the created complaint with user info
    const [complaints] = await db.execute(
      `SELECT c.*, u.fullname, u.email 
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [complaintId]
    );

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaint: {
          ...complaints[0],
          files: savedFiles
        }
      }
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint',
      error: error.message
    });
  }
};

// Get user's own complaints
const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    const [complaints] = await db.execute(
      `SELECT c.*, 
       u.fullname as user_name, 
       u.email as user_email,
       a.name as agency_name
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       LEFT JOIN agencies a ON c.assigned_agency_id = a.id
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        complaints,
        count: complaints.length
      }
    });
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  }
};

// Get single complaint with all details
const getComplaintDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get complaint with all related information
    const [complaints] = await db.execute(
      `SELECT c.*, 
       u.fullname as user_name, 
       u.email as user_email,
       a.name as agency_name,
       a.email as agency_email,
       a.id as agency_id
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       LEFT JOIN agencies a ON c.assigned_agency_id = a.id
       WHERE c.id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const complaint = complaints[0];

    // Get all updates for this complaint
    const [updates] = await db.execute(
      `SELECT cu.*, 
       u.fullname as updated_by_name,
       u.email as updated_by_email
       FROM complaint_updates cu
       LEFT JOIN users u ON cu.user_id = u.id
       WHERE cu.complaint_id = ?
       ORDER BY cu.created_at ASC`,
      [id]
    );

    // Get all files for this complaint
    const [files] = await db.execute(
      `SELECT * FROM complaint_files 
       WHERE complaint_id = ?
       ORDER BY uploaded_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        complaint: {
          ...complaint,
          updates: updates || [],
          files: files || []
        }
      }
    });
  } catch (error) {
    console.error('Get complaint details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint details',
      error: error.message
    });
  }
};

// Add update/comment to a complaint
const addComplaintUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update message is required'
      });
    }

    // Verify complaint belongs to user
    const [complaints] = await db.execute(
      'SELECT id FROM complaints WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Insert update
    const [result] = await db.execute(
      `INSERT INTO complaint_updates (complaint_id, user_id, update_type, message) 
       VALUES (?, ?, 'comment', ?)`,
      [id, userId, message.trim()]
    );

    // Fetch the created update
    const [updates] = await db.execute(
      `SELECT cu.*, 
       u.fullname as updated_by_name,
       u.email as updated_by_email
       FROM complaint_updates cu
       LEFT JOIN users u ON cu.user_id = u.id
       WHERE cu.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Update added successfully',
      data: {
        update: updates[0]
      }
    });
  } catch (error) {
    console.error('Add complaint update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add update',
      error: error.message
    });
  }
};

// Export complaints as CSV
const exportComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user's complaints with details
    const [complaints] = await db.execute(
      `SELECT c.*, 
       u.fullname as user_name, 
       u.email as user_email,
       a.name as agency_name
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       LEFT JOIN agencies a ON c.assigned_agency_id = a.id
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC`,
      [userId]
    );

    // Generate CSV content
    const csvHeaders = [
      'Tracking Number',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Location',
      'Status',
      'Agency',
      'Created Date',
      'Updated Date'
    ].join(',');

    const csvRows = complaints.map(complaint => {
      const trackingNumber = complaint.tracking_number || `CV-2025-${String(complaint.id).padStart(6, '0')}`;
      return [
        `"${trackingNumber}"`,
        `"${(complaint.title || '').replace(/"/g, '""')}"`,
        `"${(complaint.description || '').replace(/"/g, '""')}"`,
        `"${complaint.category || ''}"`,
        `"${complaint.priority || ''}"`,
        `"${(complaint.location || '').replace(/"/g, '""')}"`,
        `"${complaint.status || ''}"`,
        `"${complaint.agency_name || 'Unassigned'}"`,
        `"${complaint.created_at || ''}"`,
        `"${complaint.updated_at || complaint.created_at || ''}"`
      ].join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="complaints_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\ufeff' + csvContent); // BOM for Excel compatibility
  } catch (error) {
    console.error('Export complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export complaints',
      error: error.message
    });
  }
};

// Get real-time updates for user's complaints
const getRealtimeUpdates = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lastUpdateId = 0 } = req.query; // Get updates after this ID

    // Get updates for user's complaints
    const [updates] = await db.execute(
      `SELECT cu.*, 
       c.title as complaint_title,
       c.status as current_status,
       u.fullname as updated_by_name,
       a.name as agency_name
       FROM complaint_updates cu
       JOIN complaints c ON cu.complaint_id = c.id
       LEFT JOIN users u ON cu.user_id = u.id
       LEFT JOIN agencies a ON c.assigned_agency_id = a.id
       WHERE c.user_id = ? AND cu.id > ?
       ORDER BY cu.created_at DESC
       LIMIT 50`,
      [userId, lastUpdateId]
    );

    // Get latest update ID for next poll
    const latestUpdateId = updates.length > 0 ? updates[0].id : lastUpdateId;

    res.json({
      success: true,
      data: {
        updates,
        count: updates.length,
        latestUpdateId: parseInt(latestUpdateId)
      }
    });
  } catch (error) {
    console.error('Get realtime updates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch updates',
      error: error.message
    });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getComplaintDetails,
  addComplaintUpdate,
  exportComplaints,
  getRealtimeUpdates
};

