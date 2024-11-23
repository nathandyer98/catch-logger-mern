import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if(password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const user = await User.findOne({ email });
        if(user) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        if(newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({_id: newUser._id, fullName: newUser.fullName, email: newUser.email, profilePic: newUser.profilePic});
        }else{
            return res.status(400).json({ message: "Invalid user data" });
        }

    } catch (error) {
        console.log("Error in signup controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });

        if(!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        generateToken(user._id, res);

        res.status(200).json({_id: user._id, fullName: user.fullName, email: user.email, profilePic: user.profilePic});
    } catch (error) {
        console.log("Error in login controller", error);
        res.status(500).json({ message: "Internal server error" });        
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successful" });
    } catch (error) {
        console.log("Error in logout controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req, res) => {
    try{
        const { fullName, profilePic } = req.body;
        const userId = req.user._id
        
        if(!fullName && !profilePic) {
            return res.status(400).json({ message: "No data provided" });
        }

        const updateFields = {};

        if (fullName) {
            updateFields.fullName = fullName;
        }

        if (profilePic) {
            const uploadedResponse = await cloudinary.uploader.upload(profilePic, { folder: "user_profiles" });
            updateFields.profilePic = uploadedResponse.secure_url;
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(updatedUser);
    }catch (error) {
        console.log("Error in updateProfile controller", error);
        res.status(500).json({ message: "Internal server error" });
    }   
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}