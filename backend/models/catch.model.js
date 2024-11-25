import mongoose from "mongoose";

const CatchEnum = ["Carp", "Bream", "Tench", "Catfish", "Pike", "Perch", "Roach", "Rudd"];

const catchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true,
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
      img: {
        type: String,
        default: "", 
      },
      dateCaught: {
        type: Date,
        required: true,
      },
      location: {
        type: String,
        default: "Unknown",
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