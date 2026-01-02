const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forum.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/stats', forumController.getForumStats);
router.get('/discussions', forumController.getForumDiscussions);
router.get('/discussions/:id', forumController.getDiscussionDetails); // Must come before POST routes
router.get('/contributors', forumController.getTopContributors);

// Protected routes (authentication required)
router.post('/discussions', authenticate, forumController.createDiscussion);
router.post('/discussions/:id/vote', authenticate, forumController.voteDiscussion);
router.post('/discussions/:id/comments', authenticate, forumController.addComment);

module.exports = router;

