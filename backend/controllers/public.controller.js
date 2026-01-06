const db = require('../db');

// Get public statistics (no auth required)
const getPublicStats = async (req, res) => {
  try {
    // Total complaints
    const [totalResult] = await db.execute('SELECT COUNT(*) as count FROM complaints');
    const totalComplaints = totalResult[0].count;

    // Resolved complaints
    const [resolvedResult] = await db.execute("SELECT COUNT(*) as count FROM complaints WHERE status = 'resolved'");
    const resolvedComplaints = resolvedResult[0].count;

    // Average resolution time (in days) - simplified calculation
    let avgResolutionDays = '0.0';
    try {
      const [avgTimeResult] = await db.execute(`
        SELECT AVG(DATEDIFF(
          COALESCE(
            (SELECT MIN(created_at) FROM complaint_updates WHERE complaint_id = c.id),
            c.created_at
          ),
          c.created_at
        )) as avg_days
        FROM complaints c
        WHERE c.status = 'resolved'
      `);
      if (avgTimeResult && avgTimeResult[0] && avgTimeResult[0].avg_days !== null) {
        avgResolutionDays = parseFloat(avgTimeResult[0].avg_days).toFixed(1);
      }
    } catch (error) {
      console.log('Error calculating avg resolution time:', error.message);
      avgResolutionDays = '0.0';
    }

    // Satisfaction rate (from satisfaction_ratings table if exists, otherwise 0)
    let satisfactionRate = 0;
    try {
      const [satisfactionResult] = await db.execute(`
        SELECT AVG(rating) as avg_rating 
        FROM satisfaction_ratings 
        WHERE rating IS NOT NULL
      `);
      if (satisfactionResult && satisfactionResult[0] && satisfactionResult[0].avg_rating !== null) {
        satisfactionRate = Math.round(parseFloat(satisfactionResult[0].avg_rating) * 20); // Convert 1-5 scale to percentage
      }
    } catch (error) {
      // Table doesn't exist or no ratings, use 0
      console.log('Satisfaction ratings not available:', error.message);
      satisfactionRate = 0;
    }

    const responseData = {
      success: true,
      data: {
        totalComplaints: parseInt(totalComplaints) || 0,
        resolvedComplaints: parseInt(resolvedComplaints) || 0,
        avgResolutionDays: avgResolutionDays || '0.0',
        satisfactionRate: parseInt(satisfactionRate) || 0
      }
    };
    
    console.log('Public stats response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get public complaints (anonymized, no auth required)
const getPublicComplaints = async (req, res) => {
  try {
    const { category, status, priority, dateRange, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        c.id,
        c.tracking_number,
        c.title,
        LEFT(c.description, 200) as description,
        c.category,
        c.priority,
        c.location,
        c.affected_area,
        c.status,
        c.created_at,
        a.name as agency_name,
        COUNT(DISTINCT c2.id) as similar_count
      FROM complaints c
      LEFT JOIN agencies a ON c.assigned_agency_id = a.id
      LEFT JOIN complaints c2 ON c2.location = c.location AND c2.category = c.category AND c2.id != c.id
    `;

    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('c.category = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('c.priority = ?');
      params.push(priority);
    }

    if (dateRange) {
      const days = parseInt(dateRange);
      conditions.push('c.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      params.push(days);
    }

    if (search) {
      conditions.push('(c.title LIKE ? OR c.description LIKE ? OR c.location LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [complaints] = await db.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT c.id) as count FROM complaints c';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [countResult] = await db.execute(countQuery, params.slice(0, -2));
    const totalCount = countResult[0].count;

    res.json({
      success: true,
      data: {
        complaints,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get public complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  }
};

// Get agency performance (public)
const getAgencyPerformance = async (req, res) => {
  try {
    const [agencies] = await db.execute(`
      SELECT 
        a.id,
        a.name,
        COUNT(c.id) as total_complaints,
        SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END) as resolved_complaints,
        CASE 
          WHEN COUNT(c.id) > 0 
          THEN ROUND((SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END) / COUNT(c.id)) * 100, 0)
          ELSE 0
        END as resolution_rate
      FROM agencies a
      LEFT JOIN complaints c ON c.assigned_agency_id = a.id
      GROUP BY a.id, a.name
      HAVING total_complaints > 0
      ORDER BY resolution_rate DESC, total_complaints DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        agencies
      }
    });
  } catch (error) {
    console.error('Get agency performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agency performance',
      error: error.message
    });
  }
};

// Get trending categories
const getTrendingCategories = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const [categories] = await db.execute(`
      SELECT 
        c.category,
        COUNT(*) as count,
        COUNT(*) - COALESCE(
          (SELECT COUNT(*) 
           FROM complaints c2 
           WHERE c2.category = c.category 
           AND c2.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
           AND c2.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          ), 0
        ) as change_count
      FROM complaints c
      WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND c.category IS NOT NULL
      GROUP BY c.category
      ORDER BY count DESC
      LIMIT 10
    `, [parseInt(days), parseInt(days) * 2, parseInt(days)]);

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          category: cat.category,
          count: cat.count,
          changePercent: cat.change_count > 0 ? `+${Math.round((cat.change_count / (cat.count - cat.change_count)) * 100)}%` : '0%'
        }))
      }
    });
  } catch (error) {
    console.error('Get trending categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending categories',
      error: error.message
    });
  }
};

module.exports = {
  getPublicStats,
  getPublicComplaints,
  getAgencyPerformance,
  getTrendingCategories
};

