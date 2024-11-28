import User from "../models/user.model.js";


export const getUserProfile = async (req, res) => {
    try {
        const username = req.params.username; 

        const user = await User.findOne({ username })
            .select("fullName username profilePic catches following followers")
            .populate("catches");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ 
            _id: user._id, 
            username: user.username,
            fullName: user.fullName, 
            profilePic: user.profilePic, 
            following: user.following.length, 
            followers: user.followers.length, 
            catches: user.catches });
    } catch (error) {
        console.log("Error in getUserProfile controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// export const followUser = async (req, res) => {}

// export const unfollowUser = async (req, res) => {}

