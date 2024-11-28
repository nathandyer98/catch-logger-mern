import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    profilePic: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        default: "",
    },
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    catches:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Catch"
        }
    ]
},
{ timestamps: true })

const User = mongoose.model("User", userSchema);

export default User;