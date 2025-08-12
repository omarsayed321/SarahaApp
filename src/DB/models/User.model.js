import mongoose from "mongoose";

export let genderEnum = { male: "male", female: "female" };
export let roleEnum = { user: "user", admin: "admin" };
export let providerEnum = { system: "system", google: "google" };

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 20,
    },
    lastName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === providerEnum.system ? true : false;
      },
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(genderEnum),
        message: `gender only allow ${Object.values(genderEnum).join(" , ")}`,
      },
      default: genderEnum.male,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(roleEnum),
        message: `role only allow ${Object.values(roleEnum).join(" , ")}`,
      },
      default: roleEnum.user,
    },
    provider: {
      type: String,
      enum: { values: Object.values(providerEnum) },
      default: providerEnum.system,
    },
    picture:{secure_url:String, public_id:String},
    forgetCode: String,
    changeLoginCredenials:Date,
    confirmEmailOtp: String,
    confirmEmailOtpExpiresAt: Date,
    confirmEmailOtpFailedAttempts: Number,
    confirmEmailOtpBannedUntil: Date,
    phone: String,
    confirmEmail: Date,
    freezedAt: Date,
    freezedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    restoredAt: Date,
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("fullName").set(function (value) {
  const [firstName, lastName] = value?.split(" ") || [];
  this.set({ firstName, lastName });
}).get(function () {
  return this.firstName + " " + this.lastName;
});

UserSchema.virtual("messages", {
  localField: "_id",
  foreignField: "receiverId",
  ref: "Message",
  // count: true,
});

export const UserModel = mongoose.model("User", UserSchema);
