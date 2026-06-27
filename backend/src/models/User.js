'use strict';

const { Schema, model } = require('mongoose');

const paymentMethodSchema = new Schema(
  {
    brand: { type: String, enum: ['visa', 'mastercard', 'amex', 'other'], default: 'other' },
    last4: { type: String, required: true },
    holderName: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
  },
  {
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    avatar: { type: String, default: '' },
    emailAlerts: { type: Boolean, default: false },
    viewedProductIds: { type: [String], default: [] },
    paymentMethods: { type: [paymentMethodSchema], default: [] },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
  }
);

module.exports = model('User', userSchema);
