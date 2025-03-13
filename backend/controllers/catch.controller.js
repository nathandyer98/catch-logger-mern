import Catch from "../models/catch.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllCatches = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const catches = await Catch.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ dateCaught: -1 })
        .populate({
            path: "userId",
            select: "username fullName profilePic"
        })
        .populate({path: "comments",populate: {path: "userId",select: "username fullName profilePic"}});
            
    res.status(200).json(catches);
  } catch (error) {
      console.log("Error in getCatches controller", error);
      res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserCatches = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { username } = req.params
  const user = await User.findOne({ username });
  try {
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const userCatches = await Catch.find({ userId: user._id })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ date: -1 }).populate({
      path: "userId",
      select: "username fullName profilePic"
  })
  .populate({path: "comments",populate: {path: "userId",select: "username fullName profilePic"}});

    res.status(200).json(userCatches);
  } catch (error) {
      console.log("Error in getCatches controller", error);
      res.status(500).json({ message: "Internal server error" });
    }
}

export const getCatchesFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const currentUserId = req.user._id;

  try {
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const followingUsers = user.following;

    const catches = await Catch.find({ user: { $in: [...followingUsers, currentUserId] } })
    .populate('user', '-password')
    .populate('comments.user', '-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    res.status(200).json(catches);
 } catch (error) {
      console.log("Error in getCatchesFeed controller", error);
      res.status(500).json({ message: "Internal server error" });
    }
}

export const createCatch = async (req, res) => {
  try {
    const { species, weight, lake, dateCaught, rig, bait, distance, location, text } = req.body;
    let { photo } = req.body;
    const userId = req.user._id;

    if(!species || !weight || !dateCaught) {
      return res.status(400).json({ message: "Some fields are missing" });
    }

    if(photo){
      const uploadedResponse = await cloudinary.uploader.upload(photo, { folder: "catches" });
      photo = uploadedResponse.secure_url;
    }

    const newCatch = new Catch({
      userId,
      species,
      weight,
      lake,
      dateCaught,
      photo,
      rig,
      bait,
      distance,
      location,
      text,
      });

    if(newCatch) {
      await newCatch.save();
      res.status(201).json({...newCatch._doc, user: { _id: userId, username: req.user.username, fullName: req.user.fullName, profilePic: req.user.profilePic}});
    }else{
        res.status(500).json({ message: "Invalid catch data" });
      }
    } catch (error) {
        console.log("Error in createCatch controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
} 

export const updateCatch = async (req, res) => {
  const { catchId } = req.params;
  const userId = req.user._id;
  const updates = req.body;
  try {
    if(!updates) return res.status(400).json({ message: "No updates provided" });

    if(updates._id || updates.userId) return res.status(400).json({ message: "Not Authorized" });
    
    const catchPost = await Catch.findOne({ _id: catchId });
    if (!catchPost) return res.status(404).json({ message: "Catch not found" });

    if(updates.photo){
      if(catchPost.photo){
        await cloudinary.uploader.destroy(catchPost.photo.split('/').pop().split('.')[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(updates.photo, { folder: "catches" });
      updates.photo = uploadedResponse.secure_url;
    }

    const catchToUpdate = await Catch.findOne({ _id: catchId, userId });
    if (!catchToUpdate) {
      return res.status(403).json({ message: "Not authorized to update this catch" });
    }
    
    const updatedCatch = await Catch.findByIdAndUpdate(catchId, { $set :updates}, { new: true, runValidators: true });
    res.status(200).json(updatedCatch);
    } catch (error) {
      res.status(400).json({ message: "Error updating catch", error });
    }
}

export const deleteCatch = async (req, res) => {
    const { catchId } = req.params;
    const userId = req.user._id;
  try {
    
    const catchPost = await Catch.findOne({ _id: catchId });
    if (!catchPost) {
      return res.status(404).json({ message: "Catch not found" });
    }
    
    const catchToDelete = await Catch.findOne({ _id: catchId, userId });
    if (!catchToDelete) {
      return res.status(403).json({ message: "Not authorized to delete this catch" });
    }
    
    await Catch.deleteOne(catchToDelete);
    res.status(200).json({ message: "Catch deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting catch", error });
  }
}

export const createComment = async (req, res) => {
  const { catchId } = req.params;
  const userId = req.user._id;
  const { text } = req.body;
  try {
    if (!text) return res.status(400).json({ message: "Comment text is required" });
    
    const catchPost = await Catch.findByIdAndUpdate(catchId, { $push: { comments: { user: userId, text } } }, { new: true });
    if (!catchPost) return res.status(404).json({ message: "Catch not found" });
    
    res.status(201).json(catchPost);
  } catch (error) {
    console.log("Error in createComment controller", error);
    res.status(500).json({ message: "Error creating comment", error });
  }
}

export const deleteComment = async (req, res) => {
  const { catchId, commentId } = req.params;
  const userId = req.user._id;
  try {
    const catchPost = await Catch.findById(catchId);
    if (!catchPost) return res.status(404).json({ message: "Catch not found" });

    const comment = catchPost.comments.find(comment => comment._id == commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user._id != userId.toString()) return res.status(403).json({ message: "Not authorized to delete this comment" });

    await Catch.findByIdAndUpdate(catchId, { $pull: { comments: { _id: commentId } } }, { new: true });
    
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log("Error in deleteComment controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const updateComment = async (req, res) => {
  const { catchId, commentId } = req.params;
  const userId = req.user._id;
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const catchPost = await Catch.findById(catchId);
    if (!catchPost) return res.status(404).json({ message: "Catch not found" });

    const comment = catchPost.comments.find(comment => comment._id == commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString()  != userId) return res.status(403).json({ message: "Not authorized to update this comment" });

    const updatedCatch = await Catch.findOneAndUpdate(
      { _id: catchId, "comments._id": commentId },
      { $set: { "comments.$.text": text, "comments.$.updatedAt": Date.now() } },
      { new: true }
    );
    
    res.status(200).json(updatedCatch);
    
  } catch (error) {
    
  }
}

export const likeUnlikeCatch = async (req, res) => {
  const { catchId } = req.params;
  const userId = req.user._id;
  try {
    const catchPost = await Catch.findById(catchId);
    if(!catchPost) return res.status(404).json({ message: "Catch not found" });

    const isLiked = catchPost.likes.includes(userId);

    if(isLiked) {
      await Catch.findByIdAndUpdate(catchId, { $pull: { likes: userId } }, { new: true });
      await User.findByIdAndUpdate(userId, { $pull: { likedCatches: catchId } }, { new: true });

      await Notification.create({
        from: userId,
        to: catchPost.userId,
        type: 'like',
      });
      res.status(200).json({ message: "Like removed successfully" });
    } else {
      await Catch.findByIdAndUpdate(catchId, { $push: { likes: userId } }, { new: true });
      await User.findByIdAndUpdate(userId, { $push: { likedCatches: catchId } }, { new: true });
      res.status(200).json({ message: "Like added successfully" });
    }
  } catch (error) { 
    console.log("Error in likeUnlikeCatch controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

