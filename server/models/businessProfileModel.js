import mongoose from "mongoose";

const businessProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    gst: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    // Logos
    logoUrl: {
      type: String,
      default: "",
    },

    stampUrl: {
      type: String,
      default: "",
    },

    signatureUrl: {
      type: String,
      default: "",
    },

    signatureOwnerName: {
      type: String,
      default: "",
      trim: true,
    },

    signatureOwnerTitle: {
      type: String,
      default: "",
      trim: true,
    },

    defaultTaxPercent: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const BusinessProfile =
  mongoose.models.BusinessProfile ||
  mongoose.model("BusinessProfile", businessProfileSchema);

export default BusinessProfile;