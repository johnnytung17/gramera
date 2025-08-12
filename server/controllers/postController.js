const Post = require('../models/postModel');
const User = require('../models/userModel');
const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../utils/errorHandler');
const { deleteFile } = require('../utils/awsFunctions');
const { generateImageSuggestions, generateHashtagsOnly, generateCaptionOnly } = require('../utils/openaiVision');

// Create New Post
exports.newPost = catchAsync(async (req, res, next) => {

    const postData = {
        caption: req.body.caption,
        image: req.file.location,
        postedBy: req.user._id
    }

    const post = await Post.create(postData);

    const user = await User.findById(req.user._id);
    user.posts.push(post._id);
    await user.save();

    res.status(201).json({
        success: true,
        post,
    });
});

// Like or Unlike Post
exports.likeUnlikePost = catchAsync(async (req, res, next) => {

    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorHandler("Post Not Found", 404));
    }

    if (post.likes.includes(req.user._id)) {
        const index = post.likes.indexOf(req.user._id);

        post.likes.splice(index, 1);
        await post.save();

        return res.status(200).json({
            success: true,
            message: "Post Unliked"
        });
    } else {
        post.likes.push(req.user._id)

        await post.save();

        return res.status(200).json({
            success: true,
            message: "Post Liked"
        });
    }
});

// Delete Post
exports.deletePost = catchAsync(async (req, res, next) => {

    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorHandler("Post Not Found", 404));
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 401));
    }

    await deleteFile(post.image);

    await post.remove();

    const user = await User.findById(req.user._id);

    const index = user.posts.indexOf(req.params.id);
    user.posts.splice(index, 1);
    await user.save();

    res.status(200).json({
        success: true,
        message: "Post Deleted"
    });
});

// Update Caption
exports.updateCaption = catchAsync(async (req, res, next) => {

    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorHandler("Post Not Found", 404));
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 401));
    }

    post.caption = req.body.caption;

    await post.save();

    res.status(200).json({
        success: true,
        message: "Post Updated"
    });
});

// Add Comment
exports.newComment = catchAsync(async (req, res, next) => {

    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorHandler("Post Not Found", 404));
    }

    if (post.comments.includes(req.user._id)) {
        return next(new ErrorHandler("Already Commented", 500));
    }

    post.comments.push({
        user: req.user._id,
        comment: req.body.comment
    });

    await post.save();

    return res.status(200).json({
        success: true,
        message: "Comment Added"
    });
});

// Posts of Following
exports.getPostsOfFollowing = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user._id)

    const currentPage = Number(req.query.page) || 1;

    const skipPosts = 4 * (currentPage - 1);

    const totalPosts = await Post.find({
        postedBy: {
            $in: user.following
        }
    }).countDocuments();

    const posts = await Post.find({
        postedBy: {
            $in: user.following
        }
    }).populate("postedBy likes").populate({
        path: 'comments',
        populate: {
            path: 'user'
        }
    }).sort({ createdAt: -1 }).limit(4).skip(skipPosts)

    return res.status(200).json({
        success: true,
        posts: posts,
        totalPosts
    });
});

// Save or Unsave Post
exports.saveUnsavePost = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user._id)

    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorHandler("Post Not Found", 404));
    }

    if (user.saved.includes(post._id.toString())) {
        user.saved = user.saved.filter((p) => p.toString() !== post._id.toString())
        post.savedBy = post.savedBy.filter((p) => p.toString() !== req.user._id.toString())
        await user.save();
        await post.save();

        return res.status(200).json({
            success: true,
            message: "Post Unsaved"
        });
    } else {
        user.saved.push(post._id)
        post.savedBy.push(req.user._id)

        await user.save();
        await post.save();

        return res.status(200).json({
            success: true,
            message: "Post Saved"
        });
    }
});

// Get Post Details
exports.getPostDetails = catchAsync(async (req, res, next) => {

    const post = await Post.findById(req.params.id).populate("postedBy likes").populate({
        path: 'comments',
        populate: {
            path: 'user'
        }
    });

    if (!post) {
        return next(new ErrorHandler("Post Not Found", 404));
    }

    res.status(200).json({
        success: true,
        post,
    });
});

// Get All Posts
exports.allPosts = catchAsync(async (req, res, next) => {

    const posts = await Post.find();

    return res.status(200).json({
        posts
    });
});

// Generate AI Suggestions for Image
exports.generateAISuggestions = catchAsync(async (req, res, next) => {
    const { imageUrl, context, userKeywords } = req.body;

    console.log('🔍 AI Request received:', {
        hasImageUrl: !!imageUrl,
        imageUrlType: imageUrl?.startsWith('data:image/') ? 'base64' : 'url',
        imageUrlLength: imageUrl?.length,
        context: context,
        userKeywords: userKeywords
    });

    if (!imageUrl) {
        return next(new ErrorHandler("Image URL is required", 400));
    }

    try {
        const aiSuggestions = await generateImageSuggestions(imageUrl, context);

        if (!aiSuggestions.success) {
            console.log('⚠️ AI suggestions failed, using fallback');
            return res.status(200).json({
                success: true,
                message: "AI suggestions generated with fallback",
                suggestions: aiSuggestions.fallback,
                usingFallback: true
            });
        }

        console.log('✅ AI suggestions generated successfully');
        return res.status(200).json({
            success: true,
            message: "AI suggestions generated successfully",
            suggestions: aiSuggestions.data,
            usingFallback: false
        });

    } catch (error) {
        console.error('❌ AI Suggestion Error:', error);
        return next(new ErrorHandler("Failed to generate AI suggestions", 500));
    }
});

// Generate Hashtags Only
exports.generateHashtags = catchAsync(async (req, res, next) => {
    const { imageUrl, keywords } = req.body;

    if (!imageUrl) {
        return next(new ErrorHandler("Image URL is required", 400));
    }

    try {
        const hashtagResult = await generateHashtagsOnly(imageUrl, keywords);

        if (!hashtagResult.success) {
            return res.status(200).json({
                success: true,
                message: "Hashtags generated with fallback",
                hashtags: hashtagResult.fallback,
                usingFallback: true
            });
        }

        return res.status(200).json({
            success: true,
            message: "Hashtags generated successfully", 
            hashtags: hashtagResult.hashtags,
            usingFallback: false
        });

    } catch (error) {
        console.error('Hashtag Generation Error:', error);
        return next(new ErrorHandler("Failed to generate hashtags", 500));
    }
});

// Generate Caption Only
exports.generateCaption = catchAsync(async (req, res, next) => {
    const { imageUrl, tone, context } = req.body;

    if (!imageUrl) {
        return next(new ErrorHandler("Image URL is required", 400));
    }

    try {
        const captionResult = await generateCaptionOnly(imageUrl, tone || 'casual', context);

        if (!captionResult.success) {
            return res.status(200).json({
                success: true,
                message: "Captions generated with fallback",
                captions: captionResult.fallback,
                usingFallback: true
            });
        }

        return res.status(200).json({
            success: true,
            message: "Captions generated successfully",
            captions: captionResult.captions,
            usingFallback: false
        });

    } catch (error) {
        console.error('Caption Generation Error:', error);
        return next(new ErrorHandler("Failed to generate captions", 500));
    }
});

// Create New Post with AI Suggestions (Enhanced)
exports.newPostWithAI = catchAsync(async (req, res, next) => {
    const { caption, generateAI, useAISuggestion, context } = req.body;
    
    const postData = {
        caption: caption,
        image: req.file.location,
        postedBy: req.user._id,
        usedAiSuggestion: useAISuggestion === 'true' || useAISuggestion === true
    };

    // Generate AI suggestions if requested
    if (generateAI === 'true' || generateAI === true) {
        try {
            const aiSuggestions = await generateImageSuggestions(req.file.location, context);
            
            if (aiSuggestions.success) {
                postData.aiSuggestions = {
                    ...aiSuggestions.data,
                    generatedAt: new Date()
                };
            }
        } catch (error) {
            console.error('AI Generation Error during post creation:', error);
            // Continue without AI suggestions if there's an error
        }
    }

    const post = await Post.create(postData);

    const user = await User.findById(req.user._id);
    user.posts.push(post._id);
    await user.save();

    // Populate the post before sending response
    const populatedPost = await Post.findById(post._id)
        .populate("postedBy likes")
        .populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        });

    res.status(201).json({
        success: true,
        post: populatedPost,
    });
});