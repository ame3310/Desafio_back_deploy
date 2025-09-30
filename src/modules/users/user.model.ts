import { ROLES } from "@shared/types/role";
import type {
  IUserMethods,
  IUserModel,
  UserDocument,
  UserProps,
} from "@modules/users/user.types";
import { ERR } from "@shared/constants/error.constants";
import { ApiError } from "@shared/errors/apiError";
import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";

const SALT_ROUNDS = 12;

const userSchema = new Schema<UserProps, IUserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ROLES,
      default: "user",
      required: true,
    },
    username: { type: String, required: true, trim: true },
    usernameLower: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true },
    avatarUrl: { type: String },
    avatarPublicId: { type: String },
    refreshTokenHash: { type: String, default: null, select: false },
    companyId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: UserDocument, ret: any) => {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.usernameLower;
        return ret;
      },
    },
  }
);

userSchema.index({ usernameLower: 1 }, { unique: true });
userSchema.index({ displayName: 1, createdAt: -1 });

userSchema.pre("validate", function (this: UserDocument, next) {
  if (this.isModified("username")) {
    if (!this.username) {
      return next(
        ApiError.badRequest("Username requerido", ERR.USER.USERNAME_REQUIRED)
      );
    }
    this.username = this.username.trim();
    this.usernameLower = this.username.toLowerCase();
  }
  next();
});

userSchema.pre("save", async function (this: UserDocument, next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.method(
  "comparePassword",
  function (this: UserDocument, plain: string) {
    if (!this.password) {
      throw ApiError.badRequest("password error", ERR.AUTH.PASSWORD_ERROR);
    }
    return bcrypt.compare(plain, this.password);
  }
);

userSchema.static("findByEmailForAuth", function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );
});

userSchema.static("findByUsername", function (username: string) {
  return this.findOne({ usernameLower: username.trim().toLowerCase() });
});

export const User = model<UserProps, IUserModel>("User", userSchema);
