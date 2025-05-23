import mongoose from "mongoose";

export const CatchEnum = ["Carp", "Bream", "Tench", "Catfish", "Pike", "Perch", "Roach", "Rudd"];

const catchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  species: {
    type: String,
    required: true,
    enum: CatchEnum,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
  },
  lake: {
    type: String,
    default: "Unknown",
    required: true,
  },
  dateCaught: {
    type: Date,
    required: true,
    default: Date.now,
  },
  photo: {
    type: String,
    default: "",
    required: true,
  },
  rig: {
    type: String,
    default: "",
  },
  bait: {
    type: String,
    default: "",
  },
  distance: {
    type: Number,
    default: 0,
  },
  location: {
    type: String,
    default: "",
  },
  text: {
    type: String,
    maxLength: 200,
    default: "",
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    text: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },],

},
  { timestamps: true }
);

const Catch = mongoose.model("Catch", catchSchema);

export default Catch;