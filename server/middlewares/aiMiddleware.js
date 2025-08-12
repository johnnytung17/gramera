const ErrorHandler = require('../utils/errorHandler');

// Middleware to validate OpenAI API key
const validateOpenAI = (req, res, next) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return next(new ErrorHandler("OpenAI API key is not configured", 500));
    }
    next();
};

// Middleware to validate image URL
const validateImageUrl = (req, res, next) => {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
        return next(new ErrorHandler("Image URL is required", 400));
    }

    // Check for base64 data URL (allow data:image/*)
    if (imageUrl.startsWith('data:image/')) {
        return next();
    }

    // Basic URL validation for regular URLs
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    if (!urlPattern.test(imageUrl)) {
        return next(new ErrorHandler("Invalid image URL format", 400));
    }

    next();
};

// Middleware to handle AI service rate limiting
const handleRateLimit = (req, res, next) => {
    // Simple rate limiting implementation
    const userRequests = req.session?.aiRequests || {};
    const userId = req.user?._id?.toString() || 'anonymous';
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (!userRequests[userId]) {
        userRequests[userId] = { count: 0, resetTime: now + oneMinute };
    }

    const userLimit = userRequests[userId];

    if (now > userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + oneMinute;
    }

    if (userLimit.count >= 10) { // Max 10 requests per minute per user
        return next(new ErrorHandler("Too many AI requests. Please wait a minute.", 429));
    }

    userLimit.count++;
    
    if (req.session) {
        req.session.aiRequests = userRequests;
    }

    next();
};

module.exports = {
    validateOpenAI,
    validateImageUrl,
    handleRateLimit
};
