import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Invalid email"]
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    password: {
      type: String,
      required() {
        return this.authProvider !== "google";
      },
      minlength: 8,
      select: false
    },
    googleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true
    },
    authProvider: {
      type: String,
      enum: ["password", "google"],
      default: "password"
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.password || !this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model("User", userSchema);
