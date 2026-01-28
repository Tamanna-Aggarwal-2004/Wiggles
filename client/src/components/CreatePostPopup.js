import React, { useState } from "react";
import axios from "axios";
import "../styles/CreatePost.css";

export default function CreatePostPopup({ close }) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");

  const BASE_URL = process.env.REACT_APP_BASE_URL;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      setPreviewURL(URL.createObjectURL(selected));
    }
  };


  const handleSubmit = async () => {
    if (!file) return alert("Please select an image");

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", file);

    try {
      const res = await axios.post(`${BASE_URL}/create`, formData, {
        withCredentials: true,
      });

      if (res.data.status === "ok") {
        close();
      }
    } catch (err) {
      console.log(err);
      alert("Error creating post");
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2 className="popup-title">Create New Post</h2>

        {/* IMAGE PREVIEW */}
        <div className="preview-box">
          {previewURL ? (
            <img src={previewURL} alt="preview" className="preview-image" />
          ) : (
            <p className="preview-placeholder">Upload an image to preview</p>
          )}
        </div>

        {/* Hidden Input */}
        <label className="upload-btn">
          Choose Image
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </label>

        {/* Caption Input */}
        <textarea
          className="caption-input"
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <div className="popup-actions">
          <button className="create-btn" onClick={handleSubmit}>
            Upload
          </button>
          <button className="cancel-btn" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
