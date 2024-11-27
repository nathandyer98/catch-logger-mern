import User from "../models/user.model.js";


export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id || req.user._id;
        const user = await User.findById(userId)
        .select("fullName profilePic friends catches")
        .populate("catches");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ user, friends: user.friends.length });
    } catch (error) {
        console.log("Error in getUserProfile controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// export const followUser = async (req, res) => {}

// export const unfollowUser = async (req, res) => {}

