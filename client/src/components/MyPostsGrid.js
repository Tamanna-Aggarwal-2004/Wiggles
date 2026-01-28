import React, { useEffect, useState } from "react";
import axios from "axios";
import { MoreVertical, Trash2, X, Heart, MessageCircle, Send } from "lucide-react";
import "../styles/MyPostsGrid.css";
import { useParams } from "react-router-dom";
import { getData } from "../utils/api";

export default function MyPostsGrid() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const BASE_URL = process.env.REACT_APP_BASE_URL;

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const response = await getData("profiledata");
      if (response.data.status === "ok") {
        setCurrentUserId(response.data.foundUser._id);
      }
    };
    fetchUser();
  }, []);

  // Fetch posts
  useEffect(() => {
    axios
      .get(`${BASE_URL}/mine`, { withCredentials: true })
      .then((res) => {
        if (res.data.status === "ok") {
          setPosts(res.data.posts);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [BASE_URL]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowDropdown(null);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    setShowDropdown(null);
    setCommentText("");
    setShowComments(false);
  };

  const toggleDropdown = (e, postId) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === postId ? null : postId);
  };

  const confirmDelete = (e, postId) => {
    e.stopPropagation();
    setPostToDelete(postId);
    setShowDeleteModal(true);
    setShowDropdown(null);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${BASE_URL}/deletepost/${postToDelete}`, {
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
        if (selectedPost?._id === postToDelete) {
          setSelectedPost(null);
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const isPostOwner = (post) => {
    return post.userID?._id === currentUserId;
  };

  // Handle like toggle
  const handleLike = async (postID) => {
    try {
      const response = await fetch(`${BASE_URL}/like/${postID}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.status === "ok") {
        // Update posts in grid
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

        // Update selected post if it's the same post
        if (selectedPost?._id === postID) {
          setSelectedPost((prevPost) => ({
            ...prevPost,
            likes:
              data.action === "liked"
                ? [...prevPost.likes, currentUserId]
                : prevPost.likes.filter((id) => id !== currentUserId),
          }));
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Check if current user liked the post
  const isLikedByCurrentUser = (post) => {
    return post.likes?.includes(currentUserId);
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);

    try {
      const response = await fetch(`${BASE_URL}/comment/${selectedPost._id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        // Update the posts array
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === selectedPost._id
              ? { ...post, comments: data.comments }
              : post
          )
        );

        // Update the selected post
        setSelectedPost((prevPost) => ({
          ...prevPost,
          comments: data.comments,
        }));

        setCommentText("");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      {/* ===== POSTS GRID ===== */}
      <div className="posts-container">
        <div className="post-grid">
          {loading ? (
            <p className="loading-text">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="no-posts">No Posts Yet</p>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="grid-item"
                onClick={() => handlePostClick(post)}
              >
                {/* Three Dots Menu - Only for post owner */}
                {isPostOwner(post) && (
                  <div className="grid-menu">
                    <div
                      className="menu-trigger"
                      onClick={(e) => toggleDropdown(e, post._id)}
                    >
                      <MoreVertical size={20} />
                    </div>
                    
                    {showDropdown === post._id && (
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item delete-item"
                          onClick={(e) => confirmDelete(e, post._id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <img src={post.image} alt="post" className="grid-image" />
                <div className="grid-overlay">
                  <span className="overlay-likes">
                    ❤️ {post.likes?.length || 0}
                  </span>
                  <span className="overlay-comments">
                    💬 {post.comments?.length || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== POPUP MODAL (Instagram Style) ===== */}
      {selectedPost && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              <X size={24} />
            </button>

            {/* User Info - Top Left Corner */}
            <div className="modal-header">
              <div className="modal-user-info">
                {selectedPost.userID?.image ? (
                  <img
                    src={selectedPost.userID.image}
                    alt="User"
                    className="modal-avatar"
                  />
                ) : (
                  <div className="modal-avatar-placeholder">
                    {selectedPost.userID?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="modal-username">
                  {selectedPost.userID?.name || "Unknown User"}
                </span>
              </div>

              {/* Three Dots - Hidden for now */}
              {isPostOwner(selectedPost) && (
                <div className="modal-menu" style={{ opacity: 0, pointerEvents: 'none' }}>
                  <button
                    className="menu-trigger"
                    onClick={(e) => toggleDropdown(e, selectedPost._id)}
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {showDropdown === selectedPost._id && (
                    <div className="dropdown-menu modal-dropdown">
                      <button
                        className="dropdown-item delete-item"
                        onClick={(e) => confirmDelete(e, selectedPost._id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Post Image */}
            <div className="modal-image-wrapper">
              <img
                src={selectedPost.image}
                alt="Post"
                className="modal-image"
              />
            </div>

            {/* Post Actions */}
            <div className="modal-actions">
              <div className="action-icons">
                <button 
                  onClick={() => handleLike(selectedPost._id)}
                  className="action-btn"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: 0
                  }}
                >
                  <Heart 
                    size={24} 
                    fill={isLikedByCurrentUser(selectedPost) ? "#ed4956" : "none"}
                    color={isLikedByCurrentUser(selectedPost) ? "#ed4956" : "currentColor"}
                  />
                  <span>
                    <strong>{selectedPost.likes?.length || 0}</strong> likes
                  </span>
                </button>
              </div>
            </div>

            {/* Caption Below Post */}
            {selectedPost.caption && (
              <div className="modal-caption">
                <strong>{selectedPost.userID?.name}</strong>{" "}
                {selectedPost.caption}
              </div>
            )}

            {/* Comments Section */}
            <div className="modal-comments-section">
              {selectedPost.comments?.length > 0 && !showComments ? (
                <button 
                  onClick={() => setShowComments(true)}
                  className="comments-header-btn"
                >
                  View all {selectedPost.comments.length} comments
                </button>
              ) : null}

              {showComments && selectedPost.comments?.length > 0 && (
                <div className="modal-comments-list">
                  {selectedPost.comments.map((c) => (
                    <div key={c._id} className="comment-item">
                      <div className="comment-left">
                        {c.userID?.image ? (
                          <img
                            src={c.userID.image}
                            alt=""
                            className="comment-avatar"
                          />
                        ) : (
                          <div className="comment-avatar-placeholder">
                            {c.userID?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="comment-right">
                        <strong>{c.userID?.name}</strong> {c.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPost.comments?.length === 0 && !showComments && (
                <p className="no-comments">No comments yet</p>
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleCommentSubmit} className="modal-comment-input">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submittingComment}
                className="comment-input-field"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="comment-submit-btn"
              >
                {submittingComment ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="delete-modal-close" onClick={cancelDelete}>
              <X size={20} />
            </button>
            <div className="delete-modal-icon">
              <Trash2 size={28} />
            </div>
            <h2 className="delete-modal-title">Delete Post?</h2>
            <p className="delete-modal-message">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="delete-modal-btn cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="delete-modal-btn delete-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}