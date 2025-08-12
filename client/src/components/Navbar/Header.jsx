import React, { useEffect, useState } from 'react'
import { exploreOutline, homeFill, homeOutline, likeFill, likeOutline, messageFill, messageOutline, postUploadOutline } from './SvgIcons'
import { Link, useLocation } from 'react-router-dom';
import ProfileDetails from './ProfileDetails';
import NewPost from './NewPost';
import NewPostWithAI from './NewPostWithAI';
import { useSelector } from 'react-redux';
import SearchBox from './SearchBar/SearchBox';
import { ClickAwayListener } from '@mui/material';
import grameraLogo from '../../assests/images/logos/gramera-logo.png';

const Header = () => {

    const { user } = useSelector((state) => state.user);

    const [profileToggle, setProfileToggle] = useState(false)
    const [newPost, setNewPost] = useState(false);
    const [newPostWithAI, setNewPostWithAI] = useState(false);
    const [showPostOptions, setShowPostOptions] = useState(false);

    const location = useLocation();
    const [onHome, setOnHome] = useState(false);
    const [onChat, setOnChat] = useState(false);

    useEffect(() => {
        setOnHome(location.pathname === "/")
        setOnChat(location.pathname.split('/').includes("direct"))
    }, [location]);

    return (
        <nav className="fixed top-0 w-full border-b bg-white z-10">
            {/* <!-- navbar container --> */}
            <div className="flex flex-row justify-between items-center py-2 px-3.5 sm:w-full sm:py-2 sm:px-4 md:w-full md:py-2 md:px-6 xl:w-4/6 xl:py-3 xl:px-8 mx-auto">

                {/* <!-- logo --> */}
                <Link to="/">
                    <img
                        draggable="false"
                        className="mt-1.5 w-24 h-full object-contain"
                        src={grameraLogo}
                        alt="Gramera logo"
                    />
                </Link>

                <SearchBox />

                {/* <!-- icons container  --> */}
                <div className="flex items-center space-x-6 sm:mr-5">
                    <Link to="/">{profileToggle || !onHome ? homeOutline : homeFill}</Link>

                    <Link to="/direct/inbox">{onChat ? messageFill : messageOutline}</Link>

                    <div className="relative">
                        <div onClick={() => setShowPostOptions(!showPostOptions)} className="cursor-pointer">{postUploadOutline}</div>
                        
                        {showPostOptions && (
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-2 w-48 z-50">
                                <div 
                                    onClick={() => {
                                        setNewPost(true);
                                        setShowPostOptions(false);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                                >
                                    📸 <span>Create Post</span>
                                </div>
                                <div 
                                    onClick={() => {
                                        setNewPostWithAI(true);
                                        setShowPostOptions(false);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-t"
                                >
                                    <span className="text-purple-600">✨ Create with AI</span>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">BETA</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <span className="hidden sm:block">{exploreOutline}</span>
                    <span className="hidden sm:block">{likeOutline}</span>

                    <div onClick={() => setProfileToggle(!profileToggle)} className={`${profileToggle && 'border-black border' || (!onHome && !onChat) && 'border-black border'} rounded-full cursor-pointer h-7 w-7 p-[0.5px]`}><img draggable="false" loading="lazy" className="w-full h-full rounded-full object-cover" src={user.avatar} alt="" /></div>
                </div>

                {profileToggle &&
                    <ProfileDetails setProfileToggle={setProfileToggle} />
                }

                <NewPost newPost={newPost} setNewPost={setNewPost} />
                <NewPostWithAI newPost={newPostWithAI} setNewPost={setNewPostWithAI} />

                {/* Click away listener for post options */}
                {showPostOptions && (
                    <div className="fixed inset-0 z-40" onClick={() => setShowPostOptions(false)} />
                )}

            </div>
        </nav>
    )
}

export default Header