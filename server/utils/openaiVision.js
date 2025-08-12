const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze image and generate AI suggestions for caption, hashtags, and description
 * @param {string} imageUrl - URL of the image to analyze OR base64 data URL
 * @param {string} userContext - Optional context from user (existing caption, etc.)
 * @returns {Object} - Object containing caption, hashtags, and description suggestions
 */
const generateImageSuggestions = async (imageUrl, userContext = '') => {
    try {
        const prompt = `
Analyze this image and provide creative social media content suggestions. Consider the visual elements, mood, colors, objects, people, setting, and any text visible in the image.

${userContext ? `User context: ${userContext}` : ''}

Please provide:
1. 3 creative caption options (varying from casual to engaging to professional)
2. 15-20 relevant hashtags (mix of popular, niche, and trending)
3. A detailed image description for accessibility

Format your response as JSON:
{
  "captions": [
    "Caption option 1",
    "Caption option 2", 
    "Caption option 3"
  ],
  "hashtags": ["hashtag1", "hashtag2", ...],
  "description": "Detailed description of the image",
  "mood": "overall mood/vibe of the image",
  "colors": ["dominant", "colors", "in", "image"],
  "suggestions": {
    "bestTimeToPost": "suggested posting time",
    "audienceType": "target audience suggestion",
    "engagementTips": "tips to increase engagement"
  }
}

Make sure hashtags don't include the # symbol, just the text. Keep captions engaging and social media appropriate.
`;

        // Handle both regular URLs and base64 data URLs
        let imageContent;
        if (imageUrl.startsWith('data:image/')) {
            // It's a base64 data URL, use it directly
            imageContent = {
                type: "image_url",
                image_url: {
                    url: imageUrl,
                    detail: "high"
                }
            };
        } else {
            // It's a regular URL
            imageContent = {
                type: "image_url",
                image_url: {
                    url: imageUrl,
                    detail: "high"
                }
            };
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        imageContent
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        const content = response.choices[0].message.content;
        
        // Try to parse JSON response
        try {
            const suggestions = JSON.parse(content);
            return {
                success: true,
                data: suggestions
            };
        } catch (parseError) {
            console.error('Main suggestions JSON parse error:', parseError);
            // If JSON parsing fails, return structured fallback using AI content
            const fallbackData = {
                captions: [
                    "Sharing a beautiful moment ✨",
                    "Life is full of amazing experiences! 📸",
                    "Creating memories one post at a time 💫"
                ],
                hashtags: ["gramera", "photo", "life", "memories", "moments", "photography", "beautiful", "inspiration"],
                description: "A beautiful moment captured and shared",
                mood: "positive",
                colors: [],
                suggestions: {
                    bestTimeToPost: "6-9 PM local time",
                    audienceType: "general followers",
                    engagementTips: "Ask questions in your caption to encourage comments"
                }
            };
            
            return {
                success: true,
                data: fallbackData,
                rawContent: content
            };
        }

    } catch (error) {
        console.error('OpenAI Vision API Error:', error);
        return {
            success: false,
            error: error.message,
            fallback: {
                captions: ["Share your moment with the world! ✨", "Life is beautiful 📸", "Creating memories one post at a time 💫"],
                hashtags: ["gramera", "photo", "life", "memories", "moments", "photography", "beautiful", "inspiration"],
                description: "A beautiful moment captured and shared",
                mood: "positive",
                colors: [],
                suggestions: {
                    bestTimeToPost: "6-9 PM local time",
                    audienceType: "general followers",
                    engagementTips: "Ask questions in your caption to encourage comments"
                }
            }
        };
    }
};

/**
 * Generate hashtags based on image content and user-provided keywords
 * @param {string} imageUrl - URL of the image OR base64 data URL
 * @param {Array} keywords - User-provided keywords
 * @returns {Object} - Generated hashtags
 */
const generateHashtagsOnly = async (imageUrl, keywords = []) => {
    try {
        const keywordText = keywords.length > 0 ? `Focus on these keywords: ${keywords.join(', ')}` : '';
        
        const prompt = `
Analyze this image and generate 20-25 relevant social media hashtags.
${keywordText}

Consider:
- Visual elements in the image
- Popular social media hashtags
- Trending hashtags in related categories
- Mix of broad and niche hashtags
- Mix of popular (high competition) and less popular (low competition) hashtags

Return only hashtags as a simple array (without # symbols):
["hashtag1", "hashtag2", "hashtag3", ...]
`;

        // Handle both regular URLs and base64 data URLs
        let imageContent;
        if (imageUrl.startsWith('data:image/')) {
            imageContent = {
                type: "image_url",
                image_url: {
                    url: imageUrl,
                    detail: "low"
                }
            };
        } else {
            imageContent = {
                type: "image_url", 
                image_url: {
                    url: imageUrl,
                    detail: "low"
                }
            };
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        imageContent
                    ]
                }
            ],
            max_tokens: 300,
            temperature: 0.8
        });

        const content = response.choices[0].message.content;
        
        try {
            const hashtags = JSON.parse(content);
            return {
                success: true,
                hashtags: Array.isArray(hashtags) ? hashtags : []
            };
        } catch (parseError) {
            console.error('Hashtag JSON parse error:', parseError);
            // Try to extract hashtags from plain text
            const hashtagMatches = content.match(/#\w+/g) || content.match(/"([^"]+)"/g) || [];
            const extractedHashtags = hashtagMatches
                .map(h => h.replace(/[#"]/g, '').trim())
                .filter(h => h.length > 2)
                .slice(0, 20);
            
            return {
                success: true,
                hashtags: extractedHashtags.length > 0 ? extractedHashtags : 
                    ["photo", "gramera", "life", "moments", "photography", "beautiful", "amazing", "love"]
            };
        }

    } catch (error) {
        console.error('Hashtag generation error:', error);
        return {
            success: false,
            error: error.message,
            fallback: ["photo", "gramera", "life", "moments", "photography", "beautiful", "amazing", "love"]
        };
    }
};

/**
 * Generate caption suggestions based on image and user preferences
 * @param {string} imageUrl - URL of the image OR base64 data URL
 * @param {string} tone - Tone of the caption (casual, professional, funny, inspiring)
 * @param {string} context - Additional context
 * @returns {Object} - Generated captions
 */
const generateCaptionOnly = async (imageUrl, tone = 'casual', context = '') => {
    try {
        const prompt = `
Analyze this image and generate 5 social media caption options with a ${tone} tone.
${context ? `Additional context: ${context}` : ''}

Requirements:
- ${tone} tone
- Social media appropriate
- Engaging and likely to get comments/likes
- Vary in length (short, medium, long)
- Include call-to-action when appropriate

Return as JSON array:
["Caption 1", "Caption 2", "Caption 3", "Caption 4", "Caption 5"]
`;

        // Handle both regular URLs and base64 data URLs
        let imageContent;
        if (imageUrl.startsWith('data:image/')) {
            imageContent = {
                type: "image_url",
                image_url: {
                    url: imageUrl,
                    detail: "high"
                }
            };
        } else {
            imageContent = {
                type: "image_url",
                image_url: {
                    url: imageUrl,
                    detail: "high"
                }
            };
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o", 
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        imageContent
                    ]
                }
            ],
            max_tokens: 400,
            temperature: 0.8
        });

        const content = response.choices[0].message.content;
        
        try {
            const captions = JSON.parse(content);
            return {
                success: true,
                captions: captions
            };
        } catch (parseError) {
            console.error('Caption JSON parse error:', parseError);
            // If JSON parsing fails, try to extract captions from plain text
            const lines = content.split('\n').filter(line => line.trim());
            const extractedCaptions = lines
                .filter(line => line.includes('"') || line.match(/^\d+\./))
                .map(line => line.replace(/^\d+\.\s*/, '').replace(/['"]/g, '').trim())
                .filter(line => line.length > 10)
                .slice(0, 5);
            
            return {
                success: true,
                captions: extractedCaptions.length > 0 ? extractedCaptions : [
                    "Sharing a beautiful moment ✨",
                    "Life is full of amazing experiences! What's your favorite part of today?",
                    "Sometimes you just have to capture the magic 📸✨"
                ]
            };
        }

    } catch (error) {
        console.error('Caption generation error:', error);
        return {
            success: false,
            error: error.message,
            fallback: [
                "Sharing a beautiful moment ✨",
                "Life is full of amazing experiences! What's your favorite part of today?",
                "Sometimes you just have to capture the magic 📸✨"
            ]
        };
    }
};

module.exports = {
    generateImageSuggestions,
    generateHashtagsOnly,
    generateCaptionOnly
};
