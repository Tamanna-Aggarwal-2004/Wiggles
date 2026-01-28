import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trash2, Send, X } from 'lucide-react';
import '../styles/UserPosts.css';
import { getData } from "../utils/api";
import { toast } from "react-toastify";


const API_BASE_URL = process.env.REACT_APP_BASE_URL;

const SocialFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/all`, {
        credentials: "include",
      });

      const data = await response.json();
      console.log("Posts fetched:", data);

      if (data.status === "ok") {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postID) => {
    if (!currentUserId) {
    toast.warn("Please login to Like post ❤️");
    return;
  }
    try {
      const response = await fetch(`${API_BASE_URL}/like/${postID}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.status === "ok") {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postID
              ? {
                  ...post,
                  likes:
                    data.action === "liked"
                      ? [...post.likes, currentUserId]
                      : post.likes.filter((id) => id !== currentUserId),
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Fetch comments for a post
  const fetchComments = async (postID) => {
    setLoadingComments(prev => ({ ...prev, [postID]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/post/comments/${postID}`);
      const data = await response.json();
      console.log('Comments fetched:', data);
      if (data.status === 'ok') {
        setComments(prev => ({ ...prev, [postID]: data.comments }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postID]: false }));
    }
  };

  // Toggle comment section
  const toggleComments = async (postID) => {
    const isCurrentlyShown = showComments[postID];
    setShowComments(prev => ({ ...prev, [postID]: !isCurrentlyShown }));
    
    if (!isCurrentlyShown && !comments[postID]) {
      await fetchComments(postID);
    }
  };

  const handleComment = async (postID) => {
    if (!currentUserId) {
    toast.warn("Please login to comment 💬");
    return;
  }
    const text = commentText[postID]?.trim();
    if (!text) return;

    try {
      const response = await fetch(`${API_BASE_URL}/comment/${postID}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (data.status === 'ok') {
        setCommentText(prev => ({ ...prev, [postID]: '' }));
        
        setPosts(prev =>
          prev.map(post =>
            post._id === postID
              ? { ...post, comments: [...(post.comments || []), data.comment] }
              : post
          )
        );
        
        await fetchComments(postID);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Show delete modal
  const confirmDelete = (postID) => {
    setPostToDelete(postID);
    setShowDeleteModal(true);
  };

  // Delete post
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/deletepost/${postToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.status === 'ok') {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postToDelete));
        setShowDeleteModal(false);
        setPostToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  // Get User
  useEffect(() => {
    const fetchUser = async () => {
      const response = await getData("profiledata");
      if (response.data.status === "ok") {
        setCurrentUserId(response.data.foundUser._id);
      }
    };
    fetchUser();
    fetchPosts();
  }, []);

  // Check if current user owns the post
  const isPostOwner = (post) => {
    return post.userID?._id === currentUserId;
  };

  // Check if current user liked the post
  const isLikedByCurrentUser = (post) => {
    return post.likes?.includes(currentUserId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="social-feed-container">
      <div className="feed-content">
        <h1 className="feed-title">Social Feed</h1>
        
        {posts.length === 0 ? (
          <div className="empty-state">
            No posts yet. Be the first to post!
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post._id} className="post-card">
                {/* Post Header */}
                <div className="post-header">
                  <div className="user-info">
                    {post.userID?.image ? (
                      <img src={post.userID.image} className="avatar-img" alt="user" />
                    ) : (
                      <div className="avatar">
                        {post.userID?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="user-details">
                      <p className="user-name">
                        {post.userID?.name || 'Unknown User'}
                      </p>
                      <p className="post-date">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {isPostOwner(post) && (
                    <button
                      onClick={() => confirmDelete(post._id)}
                      className="delete-btn"
                      title="Delete post"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                {/* Post Image */}
                {post.image && (
                  <img 
                    src={post.image} 
                    alt="Post" 
                    className="post-image"
                  />
                )}

                {/* Post Caption */}
                {post.caption && (
                  <div className="post-caption">
                    <p>{post.caption}</p>
                  </div>
                )}

                {/* Post Actions */}
                <div className="post-actions">
                  <button
                    onClick={() => handleLike(post._id)}
                    className="action-btn like-btn"
                  >
                    <Heart 
                      size={24} 
                      fill={isLikedByCurrentUser(post) ? '#ef4444' : 'none'}
                      color={isLikedByCurrentUser(post) ? '#ef4444' : '#666'}
                    />
                    <span className="action-count">
                      {post.likes?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className="action-btn comment-btn"
                  >
                    <MessageCircle size={24} />
                    <span className="action-count">
                      {post.comments?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[post._id] && (
                  <div className="comments-section">
                    {/* Comment Input */}
                    <div className="comment-input">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[post._id] || ''}
                        onChange={(e) => setCommentText(prev => ({ 
                          ...prev, 
                          [post._id]: e.target.value 
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleComment(post._id);
                        }}
                        className="comment-input-field"
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        className="send-btn"
                        disabled={!commentText[post._id]?.trim()}
                      >
                        <Send size={20} />
                      </button>
                    </div>

                    {/* Comments List */}
                    {loadingComments[post._id] ? (
                      <div className="loading-comments">
                        Loading comments...
                      </div>
                    ) : comments[post._id]?.length > 0 ? (
                      <div className="comments-list">
                        {comments[post._id].map((comment, index) => (
                          <div key={comment._id || index} className="comment-item">
                            {comment.userID?.image ? (
                              <img
                                src={comment.userID.image}
                                alt="User"
                                className="comment-avatar-img"
                              />
                            ) : (
                              <div className="comment-avatar">
                                {comment.userID?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="comment-bubble">
                              <p className="comment-user-name">
                                {comment.userID?.name || 'Unknown User'}
                              </p>
                              <p className="comment-text">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-comments">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={cancelDelete}>
              <X size={20} />
            </button>
            <div className="modal-icon">
              <Trash2 size={28} />
            </div>
            <h2 className="modal-title">Delete Post?</h2>
            <p className="modal-message">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="modal-btn delete-btn-modal" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;