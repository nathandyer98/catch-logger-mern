import User from "../models/user.model.js";


export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id || req.user._id;
        const user = await User.findById(userId)
        .select("fullName profilePic catches")
        .populate("catches");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const friends = await User.findById(userId).select("friends")


        res.status(200).json({ _id: user._id, fullName: user.fullName, profilePic: user.profilePic, friends: friends.friends.length, catches: user.catches });
    } catch (error) {
        console.log("Error in getUserProfile controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// export const followUser = async (req, res) => {}

// export const unfollowUser = async (req, res) => {}

