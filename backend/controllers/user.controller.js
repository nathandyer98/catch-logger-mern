import User from "../models/user.model.js";

// export const getCurrentProfile = async (req, res) => {
//     try {
//             const user = await User.findOne(req.user._id)
//             .select("fullName username profilePic catches following followers") 
//             .populate("catches");

//         if (!user) {
//             return res.status(404).json({ message: "User not found." });
//         }

//         res.status(200).json({ 
//             _id: user._id, 
//             username: user.username,
//             fullName: user.fullName, 
//             profilePic: user.profilePic, 
//             following: user.following.length, 
//             followers: user.followers.length, 
//             catches: user.catches });
//     } catch (error) {
//         console.log("Error in getUserProfile controller", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }

export const getUsersProfile = async (req, res) => { // Add META data to check if you are following the user
    const { username } = req.params
    try {
        const user = await User.findOne({ username })
            .select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const followUnfollowUser = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    try {
        const userToFollow = await User.findById(id);
        const currentUser = await User.findById(userId);

        if (!userToFollow) {
            return res.status(404).json({ message: "User not found." });
        }

        if (userToFollow._id.toString() === userId.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself." });
        }

        if (currentUser.following.includes(id)) {
            const user = await User.findByIdAndUpdate(id, { $pull: { followers: userId } },{ new: true }).select("-password");
            await User.findByIdAndUpdate(userId, { $pull: { following: id } }, { new: true });

            return res.status(200).json({ data: user, message: "You are no longer following this user." });
        }else{
            const user =  await User.findByIdAndUpdate(id, { $push: { followers: userId } },{ new: true }).select("-password");
            await User.findByIdAndUpdate(userId, { $push: { following: id } }, { new: true });

            res.status(200).json({ data: user ,message: "You are now following this user." });
        }
    } catch (error) {
        console.log("Error in followUser controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}   

// export const unfollowUser = async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user._id;
//     try {
//         const userToUnfollow = await User.findById(id);
//         const currentUser = await User.findById(userId);    

//         if (!userToUnfollow) {
//             return res.status(404).json({ message: "User not found." });
//         }

//         if (!currentUser.following.includes(userToUnfollow._id)) {
//             return res.status(400).json({ message: "You are not following this user." });
//         }

//         await User.findByIdAndUpdate(userId, { $pull: { following: userToUnfollow._id } });
//         await User.findByIdAndUpdate(userToUnfollow._id, { $pull: { followers: userId } });
        
//         res.status(200).json({ message: "You are no longer following this user." });
//     } catch (error) {
//         console.log("Error in unfollowUser controller", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }

export const getSuggestedUsers = async (req, res) => {
    const userId = req.user._id;
    try {
        const usersFollowedByMe = await User.findById(userId).select('following');

        const users = await User.aggregate([
            { $match: { _id: { $ne: userId } } },
            { $sample: { size: 10 } }
        ])

        const filteredUsers = users.filter(user => !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach(user => user.password = null);


        res.status(200).json({ suggestedUsers })

    } catch (error) {
        console.log("Error in getSuggestedUsers: ", error);
        res.status(500).json({ message: 'Server Error' });
    }
}
