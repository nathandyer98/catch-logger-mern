import User from "../models/user.model.js";



export const getCurrentProfile = async (req, res) => {
    try {
            const user = await User.findOne(req.user._id)
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

export const getUsersProfile = async (req, res) => { // Add META data to check if you are following the user
    try {
        const { username } = req.params

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

export const followUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const userToFollow = await User.findById(id);
        const currentUser = await User.findById(userId);

        if (!userToFollow) {
            return res.status(404).json({ message: "User not found." });
        }

        if (currentUser.following.includes(userToFollow._id)) {
            return res.status(400).json({ message: "You are already following this user." });
        }

        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(userId);

        await currentUser.save();    
        await userToFollow.save();

        res.status(200).json({ message: "You are now following this user." });
    } catch (error) {
        console.log("Error in followUser controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}   

export const unfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const userToUnfollow = await User.findById(id);
        const currentUser = await User.findById(userId);    

        if (!userToUnfollow) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!currentUser.following.includes(userToUnfollow._id)) {
            return res.status(400).json({ message: "You are not following this user." });
        }

        currentUser.following.pull(userToUnfollow._id);
        userToUnfollow.followers.pull(userId);

        await currentUser.save();
        await userToUnfollow.save();

        res.status(200).json({ message: "You are no longer following this user." });
    } catch (error) {
        console.log("Error in unfollowUser controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


