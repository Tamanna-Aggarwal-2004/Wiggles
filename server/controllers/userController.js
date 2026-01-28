const { log } = require("console");
const ProfileModel = require("../models/Profile");
const cloudinary = require("cloudinary").v2;

// --------------------------------------------
// 1) PROFILE DATA OF SINGLE USER
// --------------------------------------------
module.exports.profileData = async (req, res) => {
  // If userID body se mila to use, otherwise token se (req.user.id)
  const userID = req.body.userID || req.user.id;

  // Database me profile dhundhna
  const foundUser = await ProfileModel.findOne({ _id: userID });

  // Agar mil gaya to return karo
  if (foundUser) res.json({ status: "ok", foundUser, userID });
  else {
    // Nahi mila to fail
    res.status(401).json({ status: "fail", userID });
  }
};

// --------------------------------------------
// 2) GET ALL PROFILES (everyone in database)
// --------------------------------------------
module.exports.Data = async (req, res) => {
  // Agar token present ho to userID bhi return karo
  if (req.user) {
    const Users = await ProfileModel.find();
    return res.json({ status: "ok", Users, userID: req.user.id });
  } else {
    // bina token ke sirf list de do
    const Users = await ProfileModel.find();
    return res.json({ status: "ok", Users });
  }
};

// --------------------------------------------
// 3) CLOUDINARY CONFIGURATION
// --------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// --------------------------------------------
// 4) Upload file to Cloudinary
// --------------------------------------------
async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto", // image or video both
  });
  return res;
}

// --------------------------------------------
// 5) Delete image from Cloudinary by Public ID
// --------------------------------------------
async function deleteImageFromCloudinary(publicId) {
  await cloudinary.uploader.destroy(publicId);
}

// --------------------------------------------
// 6) Extract Public ID from cloudinary image URL
// --------------------------------------------
function extractPublicIdFromImageUrl(imageUrl) {
  const parts = imageUrl.split("/");
  const publicId = parts[parts.length - 1].split(".")[0]; 
  return publicId;
}

// --------------------------------------------
// 7) UPDATE PROFILE
// --------------------------------------------
module.exports.UpdateProfile = async (req, res) => {
  try {
    const userID = req.user.id;

    // Old profile find
    const oldProfile = await ProfileModel.findById(userID);

    // Old image path and public ID
    const oldImageUrl = oldProfile.image;
    const oldPublicId = oldImageUrl && extractPublicIdFromImageUrl(oldImageUrl);

    // Basic user fields from body
    const { name, dob, bio, breed, gender, address } = req.body;

    // Health related fields
    const {
      height,
      weight,
      allergies,
      conditions,
      vetName,
      vetNumber,
      vetAddress,
    } = req.body;

    // New image path (if user uploaded)
    const imageFilePath = req.file ? req.file.path : null;

    let cldRes = null;
    if (imageFilePath) {
      // Upload new image to cloudinary
      cldRes = await handleUpload(imageFilePath);

      // Old image delete from cloudinary
      if (oldPublicId) {
        await deleteImageFromCloudinary(oldPublicId);
      }
    }

    // Fields to update (image included)
    const updatedFields = {
      name,
      dob,
      breed,
      gender,
      bio,
      address,
      height,
      weight,
      allergies,
      conditions,
      vetName,
      vetNumber,
      vetAddress,

      // If new image uploaded → use cloudinary
      // else → keep previous one (if provided)
      ...(imageFilePath
        ? { image: cldRes.secure_url }
        : { image: req.body.image != "null" ? req.body.image : "" }),
    };

    // Update database
    const updatedProfile = await ProfileModel.updateOne(
      { _id: userID },
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ message: "Profile Data Updated", profile: updatedProfile });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating profile data." });
  }
};

// --------------------------------------------
// 8) GET WARNINGS / VIOLATIONS
// --------------------------------------------
module.exports.getWarnings = async (req, res) => {
  const userID = req.body.userID || req.user.id;

  const foundUser = await ProfileModel.findOne({ _id: userID });

  // Agar user mila to uski violations return karo
  if (foundUser) return res.status(200).json(foundUser.violations);
  else {
    res.status(401).json({ status: "fail", userID });
  }
};

// --------------------------------------------
// 9) TOGGLE WARNING (true/false)
// --------------------------------------------
module.exports.toggleWarning = async (req, res) => {
  const userID = req.body.userID || req.user.id;

  try {
    const foundUser = await ProfileModel.findOne({ _id: userID });

    if (foundUser) {
      // warn ko flip karna: true → false, false → true
      foundUser.violations.warn = !foundUser.violations.warn;
      await foundUser.save();

      return res
        .status(200)
        .json({ status: "success", warnings: foundUser.violations.warn });
    } else {
      return res.status(401).json({ status: "fail", userID });
    }
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
