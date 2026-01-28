import React, { useEffect, useState } from "react";
import { AiOutlineSetting } from "react-icons/ai";
import "../styles/profile.css";
import EditProfile from "../components/EditProfile";
import { PiDogFill } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getData } from "../utils/api";
import { calculateAge } from "../utils/common";
import CreatePostPopup from "../components/CreatePostPopup";
import MyPostsGrid from "../components/MyPostsGrid";

const Profile = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [dob, setDob] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [stats, setStats] = useState({
    userPosts: 0,
    friends: 0
  });
  const navigate = useNavigate();
  const [openCreatePost, setOpenCreatePost] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getData("profiledata");
        let data = response.data;
        if (response.status === 401) {
          toast.error("Kindly login first!");
          navigate("/login");
          return;
        }
        if (data.status === "ok") {
          const user = data.foundUser;
          setName(user.name);
          setBreed(user.breed);
          setGender(user.gender);
          if (user.image === "null") {
            setImage(null);
          } else {
            setImage(user.image);
          }
          setBio(user.bio);
          setAddress(user.address);
          
          // Set real stats from backend
          setStats({
            userPosts: user.posts?.length || user.postCount || 0,
            friends: user.friends?.length || user.followerCount || 0,
          });

          const { ageInYears, ageInMonths, ageInDays } = calculateAge(user.dob);
          setDob(user.dob.slice(0, 10));
          if (ageInYears >= 1) {
            setAge(ageInYears + " years");
          } else if (ageInMonths >= 1) {
            setAge(ageInMonths + " months");
          } else {
            setAge(ageInDays + " days");
          }
        }
      } catch (err) {
        toast.warn(err);
      }
    };
    fetchData();
  }, [refresh, navigate]);

  return (
    <>
      <div className="modern-profile-container">
        <div className="profile-header">
          {/* Profile Picture */}
          <div className="profile-picture-wrapper">
            {image ? (
              <img
                className="profile-picture"
                src={image}
                alt="Profile"
                loading="lazy"
              />
            ) : (
              <div className="profile-picture-placeholder">
                <PiDogFill className="profile-placeholder-icon" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="profile-info-section">
            {/* Top Section: Name & Edit Button */}
            <div className="profile-top-row">
              <h1 className="profile-name">{name}</h1>
              <button
                className="edit-profile-btn"
                onClick={() => setOpenEditProfile(true)}
              >
                <AiOutlineSetting size={20} />
                Edit Profile
              </button>
            </div>

            {/* Stats Row */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{stats.userPosts}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.friends}</span>
                <span className="stat-label">friends</span>
              </div>
              
            </div>

            {/* Bio & Details */}
            <div className="profile-details">
              <p className="profile-bio-text">{bio || "No bio yet"}</p>
              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="info-label">Breed:</span>
                  <span className="info-value">{breed}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender:</span>
                  <span className="info-value">{gender}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age:</span>
                  <span className="info-value">{age}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location:</span>
                  <span className="info-value">{address}</span>
                </div>
              </div>
            </div>

            {/* Create Post Button */}
            <button
              className="create-post-btn"
              onClick={() => setOpenCreatePost(true)}
            >
              + Create Post
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {openEditProfile && (
        <EditProfile
          closeEditProfile={setOpenEditProfile}
          name={name}
          bio={bio}
          breed={breed}
          dob={dob}
          gender={gender}
          address={address}
          editImage={image}
          refresh={refresh}
          setRefresh={setRefresh}
        />
      )}
      {openCreatePost && (
        <CreatePostPopup close={() => setOpenCreatePost(false)} />
      )}

      {/* Posts Grid */}
      <MyPostsGrid />
    </>
  );
};

export default Profile;