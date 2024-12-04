import Catch from "../models/catch.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getCatches = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const { username } = req.params
    const user = await User.findOne({ username });
        
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const userCatches = await Catch.find({ userId: user._id })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ date: -1 });
    
    if (!userCatches.length) {
      return res.status(404).json({ message: "No catches found for this user." });
    }

    res.status(200).json(userCatches);
  } catch (error) {
      console.log("Error in getCatches controller", error);
      res.status(500).json({ message: "Internal server error" });
    }
}

export const createCatch = async (req, res) => {
  try {
    const { species, weight, lake, dateCaught, photo, rig, bait, distance, location, comments } = req.body;
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
      comments,
      });

    if(newCatch) {
      await newCatch.save();
      res.status(201).json(newCatch);
      }else{
        res.status(500).json({ message: "Invalid catch data" });
      }
    } catch (error) {
        console.log("Error in createCatch controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
} 

export const updateCatch = async (req, res) => {
  try {
    const { catchId } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    const catchToUpdate = await Catch.findOne({ _id: catchId, userId });
    if (!catchToUpdate) {
      return res.status(403).json({ message: "Not authorized to update this catch" });
    }
    
    const updatedCatch = await Catch.findByIdAndUpdate(id, { $set :updates}, { new: true, runValidators: true });
    res.status(200).json(updatedCatch);
    } catch (error) {
      res.status(400).json({ message: "Error updating catch", error });
    }
}

export const deleteCatch = async (req, res) => {
  try {
    const { catchId } = req.params;
    const userId = req.user.id;
    
    const catchToDelete = await Catch.findOne({ _id: catchId, userId });
    if (!catchToDelete) {
      return res.status(403).json({ message: "Not authorized to delete this catch" });
    }
    
    await Catch.findByIdAndDelete(id);
    res.status(200).json({ message: "Catch deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting catch", error });
  }
}

