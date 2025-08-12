const express = require('express');
const { 
    newPost, 
    likeUnlikePost, 
    deletePost, 
    newComment, 
    allPosts, 
    getPostsOfFollowing, 
    updateCaption, 
    saveUnsavePost, 
    getPostDetails,
    generateAISuggestions,
    generateHashtags,
    generateCaption,
    newPostWithAI
} = require('../controllers/postController');
const { isAuthenticated } = require('../middlewares/auth');
const { validateOpenAI, validateImageUrl, handleRateLimit } = require('../middlewares/aiMiddleware');
const { uploadPost } = require('../utils/awsFunctions');

const router = express();

router.route("/post/new").post(isAuthenticated, uploadPost.single('post'), newPost);

// AI-enhanced post creation
router.route("/post/new/ai").post(isAuthenticated, uploadPost.single('post'), newPostWithAI);

// AI suggestion endpoints
router.route("/ai/suggestions").post(isAuthenticated, validateOpenAI, handleRateLimit, validateImageUrl, generateAISuggestions);
router.route("/ai/hashtags").post(isAuthenticated, validateOpenAI, handleRateLimit, validateImageUrl, generateHashtags);
router.route("/ai/caption").post(isAuthenticated, validateOpenAI, handleRateLimit, validateImageUrl, generateCaption);

router.route("/posts/all").get(allPosts);

router.route("/posts").get(isAuthenticated, getPostsOfFollowing);

router.route("/post/detail/:id").get(isAuthenticated, getPostDetails);

router.route("/post/:id")
    .get(isAuthenticated, likeUnlikePost)
    .post(isAuthenticated, saveUnsavePost)
    .put(isAuthenticated, updateCaption)
    .delete(isAuthenticated, deletePost);

router.route("/post/comment/:id").post(isAuthenticated, newComment)

module.exports = router;