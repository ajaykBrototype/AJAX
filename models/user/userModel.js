import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, 
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: function () {
    return !this.googleId; 
  }
  },

  phone: {
    type: String,
    default: ""
  },

  dob: {
    type: Date
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },

  nationality: {
    type: String,
    default: ""
  },

  profileImage: {
    type: String,
    default: ""
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  isBlocked: {
    type: Boolean,
    default: false
  },
  googleId: {
  type: String,
}

}, {
  timestamps: true 
});

const User = mongoose.model("User", userSchema);
export default User;