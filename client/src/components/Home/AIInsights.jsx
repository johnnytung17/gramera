import React from 'react';
import { Tooltip, Chip, Box } from '@mui/material';

const AIInsights = ({ post }) => {
    if (!post.aiSuggestions || !post.usedAiSuggestion) {
        return null;
    }

    const { mood, colors, suggestions } = post.aiSuggestions;

    return (
        <Box className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-purple-600">🤖 AI Enhanced</span>
                {mood && (
                    <Chip 
                        label={`Mood: ${mood}`} 
                        size="small" 
                        variant="outlined" 
                        className="text-xs"
                    />
                )}
            </div>
            
            <div className="flex flex-wrap gap-1 text-xs text-gray-600">
                {colors && colors.length > 0 && (
                    <div className="flex items-center gap-1">
                        <span>🎨 Colors:</span>
                        {colors.slice(0, 3).map((color, index) => (
                            <span 
                                key={index}
                                className="px-1.5 py-0.5 bg-white rounded text-xs"
                            >
                                {color}
                            </span>
                        ))}
                    </div>
                )}
                
                {suggestions?.audienceType && (
                    <Tooltip title={`Target audience: ${suggestions.audienceType}`}>
                        <span className="cursor-help">👥</span>
                    </Tooltip>
                )}
                
                {suggestions?.engagementTips && (
                    <Tooltip title={suggestions.engagementTips}>
                        <span className="cursor-help">💡</span>
                    </Tooltip>
                )}
            </div>
        </Box>
    );
};

export default AIInsights;
