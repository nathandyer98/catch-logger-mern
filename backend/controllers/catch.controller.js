import Catch from "../models/catch.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getCatches = async (req, res) => {
    try {
        const userId = req.user._id;
        const userCatches = await Catch.find({ userId });
        res.status(200).json(userCatches);
    } catch (error) {
        console.log("Error in getCatches controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createCatch = async (req, res) => {
    try {
        const { species, weight, img, dateCaught, location, comments } = req.body;
        const userId = req.user._id;

        if(!species || !weight || !dateCaught) {
            return res.status(400).json({ message: "Some fields are missing" });
        }

        if(img){
            const uploadedResponse = await cloudinary.uploader.upload(img, { folder: "catches" });
            img = uploadedResponse.secure_url;
        }

        const newCatch = new Catch({
            userId,
            species,
            weight,
            img,
            dateCaught,
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
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;
    
        const catchToUpdate = await Catch.findOne({ _id: id, userId });
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
        const { id } = req.params;
        const userId = req.user.id;
    
        const catchToDelete = await Catch.findOne({ _id: id, userId });
        if (!catchToDelete) {
          return res.status(403).json({ message: "Not authorized to delete this catch" });
        }
    
        await Catch.findByIdAndDelete(id);
        res.status(200).json({ message: "Catch deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error deleting catch", error });
      }
}

