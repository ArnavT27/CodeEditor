import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Every user must have a name'],
    },
    email: {
        type: String,
        unique: [true, "Email already exist"],
        required: [true, "Please provide an email"],
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: "Please provide a valid email",
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,

    },
    passwordConfirm: {
        type: String,
        required: [true, "Please provide Password Confirm"],
        validate: {
            validator: function (passwordConfirm) {
                return this.password === passwordConfirm;
            },
            message: "Passwords are not same",
        }
    },
    lastLogin: {
        type: String,
        default: Date.now,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    resetPasswordToken: String,
    resetPasswordTokenExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordTokenExpiresAt = Date.now() + 15 * 60 * 1000;
    return resetToken;
};

// Prevent model recompilation in development
const User = mongoose.models.collabrativeEditorUsers || mongoose.model("collabrativeEditorUsers", userSchema);

export default User;