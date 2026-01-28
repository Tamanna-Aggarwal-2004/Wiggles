import React, { useEffect, useState, useCallback, memo } from "react";
import axios from "axios";
import { X, Heart, Send } from "lucide-react";
import "../styles/MyPostsGrid.css";
import { useParams } from "react-router-dom";
import { getData } from "../utils/api";

// Memoized Comment Item Component
const CommentItem = memo(({ comment }) => (
  <div className="comment-item">
    <div className="comment-left">
      {comment.userID?.image ? (
        <img src={comment.userID.image} alt="" className="comment-avatar" />
      ) : (
        <div className="comment-avatar-placeholder">
          {comment.userID?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}
    </div>
    <div className="comment-right">
      <strong>{comment.userID?.name}</strong> {comment.text}
    </div>
  </div>
));

export default function UsersPostGrid() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const { id } = useParams();
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

  // Fetch posts with optimized loading
  useEffect(() => {
    if (!id) {
      setLoading(true);
      return;
    }

    const controller = new AbortController();
    
    axios
      .get(`${BASE_URL}/allposts/${id}`, { 
        withCredentials: true,
        signal: controller.signal 
      })
      .then((res) => {
        if (res.data.status === "ok") {
          setPosts(res.data.posts);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          console.log(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [BASE_URL, id]);

  const handlePostClick = useCallback((post) => {
    setSelectedPost(post);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
    setCommentText("");
    setShowComments(false);
  }, []);

  // Optimized like handler with immediate UI update
  const handleLike = useCallback(async (postID, e) => {
    if (e) e.stopPropagation();
    
    // Optimistic update
    const updateLikes = (posts) =>
      posts.map((post) => {
        if (post._id === postID) {
          const isLiked = post.likes?.includes(currentUserId);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter((id) => id !== currentUserId)
              : [...(post.likes || []), currentUserId],
          };
        }
        return post;
      });

    setPosts(updateLikes);
    if (selectedPost?._id === postID) {
      setSelectedPost((prev) => {
        const isLiked = prev.likes?.includes(currentUserId);
        return {
          ...prev,
          likes: isLiked
            ? prev.likes.filter((id) => id !== currentUserId)
            : [...(prev.likes || []), currentUserId],
        };
      });
    }

    // Send request in background
    try {
      await fetch(`${BASE_URL}/like/${postID}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Revert on error
      setPosts(updateLikes);
      if (selectedPost?._id === postID) {
        setSelectedPost((prev) => {
          const isLiked = prev.likes?.includes(currentUserId);
          return {
            ...prev,
            likes: isLiked
              ? prev.likes.filter((id) => id !== currentUserId)
              : [...(prev.likes || []), currentUserId],
          };
        });
      }
      console.error("Error toggling like:", error);
    }
  }, [BASE_URL, currentUserId, selectedPost]);

  const isLikedByCurrentUser = useCallback((post) => {
    return post.likes?.includes(currentUserId);
  }, [currentUserId]);

  // Optimized comment submit
  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || submittingComment) return;

    const tempComment = {
      _id: Date.now().toString(),
      text: commentText.trim(),
      userID: { name: "You", _id: currentUserId },
    };

    setSubmittingComment(true);

    // Optimistic update
    const newComments = [...(selectedPost.comments || []), tempComment];
    setSelectedPost((prev) => ({ ...prev, comments: newComments }));
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === selectedPost._id ? { ...post, comments: newComments } : post
      )
    );
    setCommentText("");

    try {
      const response = await fetch(`${BASE_URL}/comment/${selectedPost._id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tempComment.text }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        // Replace temp comment with real data
        setSelectedPost((prev) => ({ ...prev, comments: data.comments }));
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === selectedPost._id ? { ...post, comments: data.comments } : post
          )
        );
      }
    } catch (error) {
      // Revert on error
      setSelectedPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c._id !== tempComment._id),
      }));
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === selectedPost._id
            ? { ...post, comments: post.comments.filter((c) => c._id !== tempComment._id) }
            : post
        )
      );
      setCommentText(tempComment.text);
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  }, [commentText, submittingComment, selectedPost, currentUserId, BASE_URL]);

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
                <img src={post.image} alt="post" className="grid-image" loading="lazy" />
                <div className="grid-overlay">
                  <span className="overlay-likes">❤️ {post.likes?.length || 0}</span>
                  <span className="overlay-comments">💬 {post.comments?.length || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== POPUP MODAL ===== */}
      {selectedPost && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              <X size={24} />
            </button>

            {/* User Info */}
            <div className="modal-header">
              <div className="modal-user-info">
                {selectedPost.userID?.image ? (
                  <img src={selectedPost.userID.image} alt="User" className="modal-avatar" />
                ) : (
                  <div className="modal-avatar-placeholder">
                    {selectedPost.userID?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="modal-username">
                  {selectedPost.userID?.name || "Unknown User"}
                </span>
              </div>
            </div>

            {/* Post Image */}
            <div className="modal-image-wrapper">
              <img src={selectedPost.image} alt="Post" className="modal-image" />
            </div>

            {/* Post Actions */}
            <div className="modal-actions">
              <div className="action-icons">
                <button
                  onClick={(e) => handleLike(selectedPost._id, e)}
                  className="action-btn"
                  aria-label="Like post"
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

            {/* Caption */}
            {selectedPost.caption && (
              <div className="modal-caption">
                <strong>{selectedPost.userID?.name}</strong> {selectedPost.caption}
              </div>
            )}

            {/* Comments Section */}
            <div className="modal-comments-section">
              {selectedPost.comments?.length > 0 && !showComments ? (
                <button onClick={() => setShowComments(true)} className="comments-header-btn">
                  View all {selectedPost.comments.length} comments
                </button>
              ) : null}

              {showComments && selectedPost.comments?.length > 0 && (
                <div className="modal-comments-list">
                  {selectedPost.comments.map((c) => (
                    <CommentItem key={c._id} comment={c} />
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
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="comment-submit-btn"
              >
                {submittingComment ? "..." : "Post"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}