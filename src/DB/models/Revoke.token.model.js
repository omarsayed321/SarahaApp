// import { Schema, model } from "mongoose";
import mongoose from "mongoose";

const RevokeTokenSchema = new mongoose.Schema(
  {
    idToken:{
      type:String,
      required:true,
    },
    expiresAccessDate:Number,
    expiresRefreshDate:Number,
  },
  {
    timestamps: true,
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const RevokeTokenModel = mongoose.model("RevokeToken", RevokeTokenSchema);
