const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    caption: {
        type: String,
        trim: true
    },
    image: {
        type: String
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            comment: {
                type: String,
                required: true,
                trim: true,
            }
        }
    ],
    savedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    // AI-generated content suggestions
    aiSuggestions: {
        captions: [{
            type: String,
            trim: true
        }],
        hashtags: [{
            type: String,
            trim: true
        }],
        description: {
            type: String,
            trim: true
        },
        mood: {
            type: String,
            trim: true
        },
        colors: [{
            type: String,
            trim: true
        }],
        suggestions: {
            bestTimeToPost: String,
            audienceType: String,
            engagementTips: String
        },
        generatedAt: {
            type: Date,
            default: Date.now
        }
    },
    // Track if AI suggestions were used
    usedAiSuggestion: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("Post", postSchema);