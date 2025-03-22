require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type id = mongoose.Types.ObjectId;

export interface IUser extends Document {
  length: number;
  name: string;
  username?: string;
  email: string;
  password: string;

  role: string;

  createdAt?: string;

  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}



const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: [true, 'Please enter your name'],
    },
    username: {
      type: String,
      // required: true,
      unique: true,
      minlength: 3,
      lowercase: true,
      match: /^[A-Za-z0-9]*$/, // This regex allows letters and numbers
    },
    email: {
      type: String,
      // required: [true, 'Please enter your email'],
      validate: {
        validator(value: string) {
          return emailRegexPattern.test(value);
        },
        message: "please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      // required: [true, "Please enter your password"],
      minlength: [6, "Password must be atleast 6 characters"],
      select: false,
    },
    role: {
      type: String,
      default: "user",
    }
  },
  { timestamps: true },
);

// Hash Password before saving
userSchema.pre<IUser>("save", async function(next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign Access token
userSchema.methods.SignAccessToken = function() {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "15d",
  });
};

// sign Refresh token
userSchema.methods.SignRefreshToken = function() {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};

// compare password
userSchema.methods.comparePassword = async function(
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// userSchema.index({ username: 1 });
const userModel: Model<IUser> = mongoose.model("User", userSchema);
export default userModel;
