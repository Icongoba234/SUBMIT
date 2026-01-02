const db = require('../db');

// Get forum statistics (no auth required)
const getForumStats = async (req, res) => {
  try {
    // Active members (users who have posted discussions or comments)
    const [membersResult] = await db.execute(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM (
        SELECT user_id FROM forum_discussions
        UNION
        SELECT user_id FROM forum_comments
      ) as active_users
    `);
    const activeMembers = membersResult[0].count || 0;

    // Total discussions
    const [discussionsResult] = await db.execute('SELECT COUNT(*) as count FROM forum_discussions');
    const totalDiscussions = discussionsResult[0].count || 0;

    // Total comments
    const [commentsResult] = await db.execute('SELECT COUNT(*) as count FROM forum_comments');
    const totalComments = commentsResult[0].count || 0;

    // Solutions implemented (discussions with high votes and resolved status - using a threshold)
    const [solutionsResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM forum_discussions 
      WHERE votes >= 20 AND views >= 100
    `);
    const solutionsImplemented = solutionsResult[0].count || 0;

    res.json({
      success: true,
      data: {
        activeMembers: parseInt(activeMembers) || 0,
        totalDiscussions: parseInt(totalDiscussions) || 0,
        totalComments: parseInt(totalComments) || 0,
        solutionsImplemented: parseInt(solutionsImplemented) || 0
      }
    });
  } catch (error) {
    console.error('Get forum stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum statistics',
      error: error.message
    });
  }
};

// Get forum discussions
const getForumDiscussions = async (req, res) => {
  try {
    const { category, sort = 'latest', page = 1, limit = 10, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        fd.id,
        fd.title,
        LEFT(fd.content, 300) as content,
        fd.category,
        fd.is_featured,
        fd.views,
        fd.votes,
        fd.created_at,
        u.fullname as author_name,
        u.profile_picture as author_avatar,
        COUNT(DISTINCT fc.id) as reply_count
      FROM forum_discussions fd
      JOIN users u ON fd.user_id = u.id
      LEFT JOIN forum_comments fc ON fc.discussion_id = fd.id
    `;

    const conditions = [];
    const params = [];

    if (category && category !== 'all') {
      conditions.push('fd.category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(fd.title LIKE ? OR fd.content LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY fd.id';

    // Sorting
    switch (sort) {
      case 'popular':
        query += ' ORDER BY fd.votes DESC, fd.views DESC';
        break;
      case 'replies':
        query += ' ORDER BY reply_count DESC';
        break;
      case 'oldest':
        query += ' ORDER BY fd.created_at ASC';
        break;
      case 'latest':
      default:
        query += ' ORDER BY fd.is_featured DESC, fd.created_at DESC';
        break;
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [discussions] = await db.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT fd.id) as count FROM forum_discussions fd';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [countResult] = await db.execute(countQuery, params.slice(0, -2));
    const totalCount = countResult[0].count;

    res.json({
      success: true,
      data: {
        discussions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get forum discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions',
      error: error.message
    });
  }
};

// Get top contributors
const getTopContributors = async (req, res) => {
  try {
    const [contributors] = await db.execute(`
      SELECT 
        u.id,
        u.fullname,
        u.profile_picture,
        COUNT(DISTINCT fd.id) as discussions_count,
        COUNT(DISTINCT fc.id) as comments_count,
        (COUNT(DISTINCT fd.id) * 10 + COUNT(DISTINCT fc.id) * 2) as points
      FROM users u
      LEFT JOIN forum_discussions fd ON fd.user_id = u.id
      LEFT JOIN forum_comments fc ON fc.user_id = u.id
      WHERE u.role = 'citizen'
      GROUP BY u.id, u.fullname, u.profile_picture
      HAVING points > 0
      ORDER BY points DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        contributors: contributors.map(c => ({
          id: c.id,
          name: c.fullname,
          avatar: c.profile_picture,
          discussions: c.discussions_count || 0,
          comments: c.comments_count || 0,
          points: c.points || 0
        }))
      }
    });
  } catch (error) {
    console.error('Get top contributors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top contributors',
      error: error.message
    });
  }
};

// Create new discussion (protected)
const createDiscussion = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO forum_discussions (user_id, title, content, category) 
       VALUES (?, ?, ?, ?)`,
      [userId, title, content, category || 'general']
    );

    // Fetch the created discussion
    const [discussions] = await db.execute(
      `SELECT fd.*, u.fullname as author_name, u.profile_picture as author_avatar
       FROM forum_discussions fd
       JOIN users u ON fd.user_id = u.id
       WHERE fd.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      data: {
        discussion: discussions[0]
      }
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion',
      error: error.message
    });
  }
};

// Vote on discussion (protected)
const voteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user already voted
    const [existingVote] = await db.execute(
      'SELECT id FROM forum_votes WHERE discussion_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingVote.length > 0) {
      // Remove vote
      await db.execute(
        'DELETE FROM forum_votes WHERE discussion_id = ? AND user_id = ?',
        [id, userId]
      );
      await db.execute('UPDATE forum_discussions SET votes = votes - 1 WHERE id = ?', [id]);
    } else {
      // Add vote
      await db.execute(
        'INSERT INTO forum_votes (discussion_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
      await db.execute('UPDATE forum_discussions SET votes = votes + 1 WHERE id = ?', [id]);
    }

    // Get updated vote count
    const [discussion] = await db.execute('SELECT votes FROM forum_discussions WHERE id = ?', [id]);

    res.json({
      success: true,
      data: {
        votes: discussion[0].votes
      }
    });
  } catch (error) {
    console.error('Vote discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on discussion',
      error: error.message
    });
  }
};

// Get discussion details with comments/replies
const getDiscussionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get discussion
    const [discussions] = await db.execute(`
      SELECT 
        fd.id,
        fd.title,
        fd.content,
        fd.category,
        fd.is_featured,
        fd.views,
        fd.votes,
        fd.created_at,
        u.id as author_id,
        u.fullname as author_name,
        u.profile_picture as author_avatar
      FROM forum_discussions fd
      JOIN users u ON fd.user_id = u.id
      WHERE fd.id = ?
    `, [id]);

    if (discussions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Increment view count
    await db.execute('UPDATE forum_discussions SET views = views + 1 WHERE id = ?', [id]);

    const discussion = discussions[0];

    // Get all comments/replies for this discussion
    const [comments] = await db.execute(`
      SELECT 
        fc.id,
        fc.content,
        fc.parent_comment_id,
        fc.created_at,
        u.id as user_id,
        u.fullname as author_name,
        u.profile_picture as author_avatar
      FROM forum_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.discussion_id = ?
      ORDER BY fc.created_at ASC
    `, [id]);

    // Organize comments into a tree structure (parent comments and their replies)
    const commentsMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
      const commentData = {
        id: comment.id,
        content: comment.content,
        parentCommentId: comment.parent_comment_id,
        createdAt: comment.created_at,
        authorName: comment.author_name,
        authorAvatar: comment.author_avatar,
        replies: []
      };

      commentsMap.set(comment.id, commentData);

      if (comment.parent_comment_id === null) {
        rootComments.push(commentData);
      } else {
        const parent = commentsMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentData);
        }
      }
    });

    res.json({
      success: true,
      data: {
        discussion: {
          id: discussion.id,
          title: discussion.title,
          content: discussion.content,
          category: discussion.category,
          isFeatured: discussion.is_featured,
          views: discussion.views + 1, // Include the increment
          votes: discussion.votes,
          createdAt: discussion.created_at,
          authorId: discussion.author_id,
          authorName: discussion.author_name,
          authorAvatar: discussion.author_avatar
        },
        comments: rootComments
      }
    });
  } catch (error) {
    console.error('Get discussion details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussion details',
      error: error.message
    });
  }
};

// Add comment/reply to discussion (protected)
const addComment = async (req, res) => {
  try {
    const { id } = req.params; // discussion_id
    const { content, parent_comment_id } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Verify discussion exists
    const [discussions] = await db.execute('SELECT id FROM forum_discussions WHERE id = ?', [id]);
    if (discussions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // If replying to a comment, verify parent comment exists and belongs to same discussion
    if (parent_comment_id) {
      const [parentComments] = await db.execute(
        'SELECT id FROM forum_comments WHERE id = ? AND discussion_id = ?',
        [parent_comment_id, id]
      );
      if (parentComments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Insert comment
    const [result] = await db.execute(
      `INSERT INTO forum_comments (discussion_id, user_id, content, parent_comment_id) 
       VALUES (?, ?, ?, ?)`,
      [id, userId, content.trim(), parent_comment_id || null]
    );

    // Fetch the created comment with user info
    const [comments] = await db.execute(`
      SELECT 
        fc.id,
        fc.content,
        fc.parent_comment_id,
        fc.created_at,
        u.id as user_id,
        u.fullname as author_name,
        u.profile_picture as author_avatar
      FROM forum_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.id = ?
    `, [result.insertId]);

    const comment = comments[0];

    res.status(201).json({
      success: true,
      message: parent_comment_id ? 'Reply added successfully' : 'Comment added successfully',
      data: {
        comment: {
          id: comment.id,
          content: comment.content,
          parentCommentId: comment.parent_comment_id,
          createdAt: comment.created_at,
          authorName: comment.author_name,
          authorAvatar: comment.author_avatar,
          replies: []
        }
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

module.exports = {
  getForumStats,
  getForumDiscussions,
  getTopContributors,
  createDiscussion,
  voteDiscussion,
  getDiscussionDetails,
  addComment
};

