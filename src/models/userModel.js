// src/models/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: false,
    },

    // New relational fields
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",          // references Role model
      required: true,
    },

    orgn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",  // references Organization model
      required: true,
    },

    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",        // references Member model
      required: true,
    },

    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};
*/

export const User = mongoose.model("User", userSchema);

/* Sample document
{
  "_id": "665f1a2c9d1e4b1234567890",
  "email": "john.doe@example.com",
  "password": "$2a$10$hashedpasswordstring",
  "role_id": "665f19f29d1e4b1234567888",       // Role: "PMU-Admin"
  "orgn_id": "665f19f29d1e4b1234567889",       // Organization: "NSS Unit Dadri"
  "member_id": "665f19f29d1e4b1234567890",     // Member: "John Doe"
  "refreshToken": null,
  "createdAt": "2026-06-05T09:00:00.000Z",
  "updatedAt": "2026-06-05T09:00:00.000Z"
}

*/