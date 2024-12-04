import mongoose from "mongoose";

const CatchEnum = ["Carp", "Bream", "Tench", "Catfish", "Pike", "Perch", "Roach", "Rudd"];

const catchSchema = new mongoose.Schema({
    userId: {
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
      },
      dateCaught: {
        type: Date,
        required: true,
      },
      photo: {
        type: String,
        default: "", 
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
      comments: {
        type: String,
        maxLength: 200, 
      },
    },
    { timestamps: true }
  );
  
  const Catch = mongoose.model("Catch", catchSchema);
  
  export default Catch;