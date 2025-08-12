import { Dialog, LinearProgress, Button, Chip, Tooltip, CircularProgress } from '@mui/material';
import { Picker } from 'emoji-mart';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addNewPost, clearErrors } from '../../actions/postAction';
import { NEW_POST_RESET } from '../../constants/postConstants';
import { emojiIcon } from '../Home/SvgIcons';
import axios from 'axios';

const NewPostWithAI = ({ newPost, setNewPost }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, success, error } = useSelector((state) => state.newPost);
    const { user } = useSelector((state) => state.user);

    const [postImage, setPostImage] = useState("");
    const [postPreview, setPostPreview] = useState("");
    const [caption, setCaption] = useState("");
    const [showEmojis, setShowEmojis] = useState(false);
    const [dragged, setDragged] = useState(false);

    // AI States
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [captionTone, setCaptionTone] = useState('casual');
    const [customKeywords, setCustomKeywords] = useState('');

    const handleDragChange = () => {
        setDragged(!dragged);
    }

    const handleFileChange = (e) => {
        const reader = new FileReader();
        setPostImage("");
        setPostPreview("")
        reader.onload = () => {
            if (reader.readyState === 2) {
                setPostPreview(reader.result);
            }
        };

        reader.readAsDataURL(e.target.files[0]);
        setPostImage(e.target.files[0]);
        
        // Reset AI suggestions when new image is selected
        setAiSuggestions(null);
        setSelectedHashtags([]);
    }

    // Generate AI Suggestions
    const generateAISuggestions = async () => {
        if (!postImage) {
            toast.error("Please select an image first");
            return;
        }

        setAiLoading(true);
        try {
            // First upload image to get URL
            const formData = new FormData();
            formData.set("post", postImage);
            
            // For demo purposes, we'll use a placeholder URL
            // In production, you might want to upload to temp storage first
            const imageUrl = postPreview;
            
            const response = await axios.post('/api/v1/ai/suggestions', {
                imageUrl: imageUrl,
                context: customKeywords || undefined
            });

            if (response.data.success) {
                setAiSuggestions(response.data.suggestions);
                setSelectedHashtags(response.data.suggestions.hashtags?.slice(0, 10) || []);
                setShowAISuggestions(true);
                
                // Auto-apply first caption suggestion if available
                if (response.data.suggestions.captions && response.data.suggestions.captions.length > 0) {
                    setCaption(response.data.suggestions.captions[0]);
                }
                
                toast.success("AI suggestions generated!");
            } else {
                toast.error("Failed to generate AI suggestions");
            }
        } catch (error) {
            console.error('AI Suggestion Error:', error);
            toast.error(error.response?.data?.message || "Failed to generate AI suggestions");
        } finally {
            setAiLoading(false);
        }
    };

    // Generate specific captions
    const generateCaptions = async (tone) => {
        if (!postImage) {
            toast.error("Please select an image first");
            return;
        }

        setAiLoading(true);
        try {
            const imageUrl = postPreview;
            
            const response = await axios.post('/api/v1/ai/caption', {
                imageUrl: imageUrl,
                tone: tone,
                context: customKeywords || undefined
            });

            if (response.data.success) {
                const newSuggestions = { 
                    ...aiSuggestions, 
                    captions: response.data.captions 
                };
                setAiSuggestions(newSuggestions);
                toast.success(`${tone} captions generated!`);
            } else {
                toast.error("Failed to generate captions");
            }
        } catch (error) {
            console.error('Caption Generation Error:', error);
            toast.error(error.response?.data?.message || "Failed to generate captions");
        } finally {
            setAiLoading(false);
        }
    };

    // Generate hashtags only
    const generateHashtags = async () => {
        if (!postImage) {
            toast.error("Please select an image first");
            return;
        }

        setAiLoading(true);
        try {
            const imageUrl = postPreview;
            const keywords = customKeywords ? customKeywords.split(',').map(k => k.trim()) : [];
            
            const response = await axios.post('/api/v1/ai/hashtags', {
                imageUrl: imageUrl,
                keywords: keywords
            });

            if (response.data.success) {
                const newSuggestions = { 
                    ...aiSuggestions, 
                    hashtags: response.data.hashtags 
                };
                setAiSuggestions(newSuggestions);
                setSelectedHashtags(response.data.hashtags?.slice(0, 10) || []);
                toast.success("Hashtags generated!");
            } else {
                toast.error("Failed to generate hashtags");
            }
        } catch (error) {
            console.error('Hashtag Generation Error:', error);
            toast.error(error.response?.data?.message || "Failed to generate hashtags");
        } finally {
            setAiLoading(false);
        }
    };

    const toggleHashtag = (hashtag) => {
        setSelectedHashtags(prev => 
            prev.includes(hashtag) 
                ? prev.filter(h => h !== hashtag)
                : [...prev, hashtag]
        );
    };

    const applyCaptionSuggestion = (suggestionCaption) => {
        setCaption(suggestionCaption);
        toast.success("Caption applied!");
    };

    const applyHashtags = () => {
        const hashtagText = selectedHashtags.map(h => `#${h}`).join(' ');
        setCaption(prev => {
            const newCaption = prev + (prev ? '\n\n' : '') + hashtagText;
            return newCaption;
        });
        toast.success("Hashtags added to caption!");
    };

    const applyFullAISuggestion = () => {
        if (aiSuggestions) {
            let fullCaption = '';
            
            // Add caption if available
            if (aiSuggestions.captions && aiSuggestions.captions.length > 0) {
                fullCaption = aiSuggestions.captions[0];
            }
            
            // Add hashtags
            if (selectedHashtags.length > 0) {
                const hashtagText = selectedHashtags.map(h => `#${h}`).join(' ');
                fullCaption += (fullCaption ? '\n\n' : '') + hashtagText;
            }
            
            setCaption(fullCaption);
            toast.success("Full AI suggestion applied!");
        }
    };

    const newPostSubmitHandler = (e) => {
        e.preventDefault();
        if (!postImage) {
            toast.error("Select Image");
            return
        }
        if (!caption.trim()) {
            toast.error("Empty Caption");
            return
        }

        const formData = new FormData();
        formData.set("caption", caption);
        formData.set("post", postImage);
        formData.set("generateAI", "true");
        formData.set("useAISuggestion", aiSuggestions ? "true" : "false");
        formData.set("context", customKeywords || "");

        dispatch(addNewPost(formData));
    }

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearErrors());
        }
        if (success) {
            toast.success("Post Shared with AI Enhancement!");
            dispatch({ type: NEW_POST_RESET });
            setNewPost(false)
            navigate("/");

            // Reset all states
            setPostImage("");
            setPostPreview("");
            setCaption("");
            setAiSuggestions(null);
            setSelectedHashtags([]);
            setShowAISuggestions(false);
            setCustomKeywords("");
        }
    }, [dispatch, error, success, navigate]);

    return (
        <Dialog open={newPost} onClose={() => setNewPost(false)} maxWidth='xl'>
            <div className="flex flex-col sm:w-screen max-w-6xl">
                <div className="bg-white py-3 border-b px-4 flex justify-between w-full">
                    <span className="font-medium flex items-center gap-2">
                        Create new post with AI ✨
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">BETA</span>
                    </span>
                    <button 
                        onClick={newPostSubmitHandler} 
                        disabled={loading} 
                        className="text-blue-500 font-medium disabled:opacity-50"
                    >
                        Share
                    </button>
                </div>
                {loading && <LinearProgress />}

                <div className="flex sm:flex-row sm:items-start items-center flex-col w-full">

                    {/* Image Upload Section */}
                    {postImage ?
                        <div className="bg-black h-48 sm:h-[80vh] w-full relative">
                            <img draggable="false" className="object-contain h-full w-full" src={postPreview} alt="post" />
                            
                            {/* AI Generation Button Overlay */}
                            {!aiSuggestions && (
                                <div className="absolute top-4 right-4">
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={generateAISuggestions}
                                        disabled={aiLoading}
                                        sx={{ 
                                            backgroundColor: '#8B5CF6',
                                            '&:hover': { backgroundColor: '#7C3AED' }
                                        }}
                                    >
                                        {aiLoading ? <CircularProgress size={16} color="inherit" /> : '🤖 Generate AI'}
                                    </Button>
                                </div>
                            )}
                        </div>
                        :
                        <div onDragEnter={handleDragChange} onDragLeave={handleDragChange} className={`${dragged && 'opacity-40'} relative bg-white h-36 sm:h-[80vh] w-full flex flex-col gap-2 items-center justify-center mx-16`}>
                            <svg aria-label="Icon to represent media such as images or videos" color="#262626" fill="#262626" height="77" role="img" viewBox="0 0 97.6 77.3" width="96">
                                <path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z" fill="currentColor"></path>
                                <path d="M84.7 18.4L58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.7-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.8.3L7 49 5.2 17c-.2-2.3.6-4.5 2-6.2zm8.7 48c-4.3.2-8.1-2.8-8.8-7.1l9.4-10.5c.2-.3.6-.4 1-.5.4 0 .7.1 1 .4l7.8 7c.7.6 1.6.9 2.5.9.9 0 1.7-.5 2.3-1.1l7.8-8.8-1.1 18.6-21.9 1.1zm76.5-29.5l-2 34c-.3 4.6-4.3 8.2-8.9 7.9l-34-2c-4.6-.3-8.2-4.3-7.9-8.9l2-34c.3-4.4 3.9-7.9 8.4-7.9h.5l34 2c4.7.3 8.2 4.3 7.9 8.9z" fill="currentColor"></path>
                                <path d="M78.2 41.6L61.3 30.5c-2.1-1.4-4.9-.8-6.2 1.3-.4.7-.7 1.4-.7 2.2l-1.2 20.1c-.1 2.5 1.7 4.6 4.2 4.8h.3c.7 0 1.4-.2 2-.5l18-9c2.2-1.1 3.1-3.8 2-6-.4-.7-.9-1.3-1.5-1.8zm-1.4 6l-18 9c-.4.2-.8.3-1.3.3-.4 0-.9-.2-1.2-.4-.7-.5-1.2-1.3-1.1-2.2l1.2-20.1c.1-.9.6-1.7 1.4-2.1.8-.4 1.7-.3 2.5.1L77 43.3c1.2.8 1.5 2.3.7 3.4-.2.4-.5.7-.9.9z" fill="currentColor"></path>
                            </svg>
                            <p className="text-xl">Drag photos and videos here</p>
                            <p className="text-sm text-purple-600 font-medium">✨ AI will analyze your image automatically</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute h-full w-full opacity-0" />
                        </div>
                    }

                    {/* Caption and AI Section */}
                    <div className="flex flex-col border-l sm:h-[80vh] w-full bg-white overflow-y-auto">

                        <div className="flex gap-3 px-3 py-2 items-center border-b">
                            <img draggable="false" className="w-11 h-11 rounded-full object-cover" src={user.avatar} alt="avatar" />
                            <span className="text-black text-sm font-semibold">{user.username}</span>
                        </div>

                        {/* AI Controls */}
                        {postImage && (
                            <div className="p-3 border-b bg-gray-50">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700">AI Keywords (optional):</span>
                                        <input
                                            type="text"
                                            placeholder="e.g. travel, sunset, friends"
                                            value={customKeywords}
                                            onChange={(e) => setCustomKeywords(e.target.value)}
                                            className="flex-1 px-2 py-1 border rounded text-sm"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={generateAISuggestions}
                                            disabled={aiLoading}
                                        >
                                            {aiLoading ? <CircularProgress size={16} /> : '🎯 Full Analysis'}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => generateCaptions('casual')}
                                            disabled={aiLoading}
                                        >
                                            💬 Casual Captions
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => generateCaptions('professional')}
                                            disabled={aiLoading}
                                        >
                                            👔 Professional
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={generateHashtags}
                                            disabled={aiLoading}
                                        >
                                            # Hashtags
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-3 w-full relative flex-1">
                            <label className="block mb-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500
                                    file:mr-3 file:py-2 file:px-6
                                    file:rounded-full file:border-0
                                    file:text-sm file:cursor-pointer file:font-semibold
                                    file:bg-purple-100 file:text-purple-700
                                    hover:file:bg-purple-200
                                    "/>
                            </label>
                            <textarea
                                className="outline-none resize-none w-full min-h-[120px]"
                                placeholder="Write a caption... or let AI suggest one!"
                                name="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                onClick={() => setShowEmojis(false)}
                            />

                            <div className="flex items-center justify-between mt-4">
                                <span onClick={() => setShowEmojis(!showEmojis)} className="cursor-pointer">{emojiIcon}</span>

                                {showEmojis && (
                                    <div className="absolute bottom-10 -left-20">
                                        <Picker
                                            set="google"
                                            onSelect={(e) => setCaption(caption + e.native)}
                                            title="Emojis"
                                        />
                                    </div>
                                )}

                                <button 
                                    onClick={newPostSubmitHandler} 
                                    disabled={loading} 
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-1.5 rounded font-medium hover:drop-shadow-lg uppercase text-sm tracking-wider disabled:opacity-50"
                                >
                                    {loading ? 'Posting...' : 'Post with AI ✨'}
                                </button>
                            </div>
                        </div>

                        {/* AI Suggestions Panel */}
                        {aiSuggestions && (
                            <div className="border-t bg-gradient-to-br from-purple-50 to-blue-50 p-4 max-h-96 overflow-y-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                        🤖 AI Suggestions
                                        {aiSuggestions.mood && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                Mood: {aiSuggestions.mood}
                                            </span>
                                        )}
                                    </h3>
                                    <Button 
                                        size="small" 
                                        variant="contained"
                                        onClick={applyFullAISuggestion}
                                        sx={{ 
                                            backgroundColor: '#8B5CF6',
                                            '&:hover': { backgroundColor: '#7C3AED' }
                                        }}
                                    >
                                        ✨ Apply All
                                    </Button>
                                </div>

                                {/* Caption Suggestions */}
                                {aiSuggestions.captions && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">💬 Caption Ideas:</h4>
                                        <div className="space-y-2">
                                            {aiSuggestions.captions.slice(0, 3).map((cap, index) => (
                                                <div key={index} className="bg-white p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors"
                                                     onClick={() => applyCaptionSuggestion(cap)}>
                                                    <p className="text-sm text-gray-800">{cap}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hashtag Suggestions */}
                                {aiSuggestions.hashtags && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-medium text-gray-700"># Hashtag Suggestions:</h4>
                                            <Button size="small" onClick={applyHashtags} variant="outlined">
                                                Add Selected
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {aiSuggestions.hashtags.slice(0, 20).map((hashtag, index) => (
                                                <Chip
                                                    key={index}
                                                    label={`#${hashtag}`}
                                                    size="small"
                                                    clickable
                                                    color={selectedHashtags.includes(hashtag) ? "primary" : "default"}
                                                    onClick={() => toggleHashtag(hashtag)}
                                                    variant={selectedHashtags.includes(hashtag) ? "filled" : "outlined"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Additional AI Insights */}
                                {aiSuggestions.suggestions && (
                                    <div className="text-xs text-gray-600 space-y-1">
                                        {aiSuggestions.suggestions.bestTimeToPost && (
                                            <p>⏰ Best time: {aiSuggestions.suggestions.bestTimeToPost}</p>
                                        )}
                                        {aiSuggestions.suggestions.audienceType && (
                                            <p>👥 Target: {aiSuggestions.suggestions.audienceType}</p>
                                        )}
                                        {aiSuggestions.suggestions.engagementTips && (
                                            <Tooltip title={aiSuggestions.suggestions.engagementTips}>
                                                <p className="cursor-help">💡 Engagement tip available (hover)</p>
                                            </Tooltip>
                                        )}
                                    </div>
                                )}

                                {/* Image Description for Accessibility */}
                                {aiSuggestions.description && (
                                    <div className="mt-3 pt-3 border-t">
                                        <h4 className="text-xs font-medium text-gray-600 mb-1">♿ Accessibility Description:</h4>
                                        <p className="text-xs text-gray-600">{aiSuggestions.description}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    )
}

export default NewPostWithAI
