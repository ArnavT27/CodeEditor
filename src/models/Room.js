import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        default: 'Untitled Room'
    },
    meetLink: {
        type: String,
        required: false
    },
    eventId: {
        type: String
    },
    createdBy: {
        type: String,
        required: false
    },
    participants: [{
        userId: String,
        userName: String,
        joinedAt: Date
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
});

// Update lastActivity on any update
RoomSchema.pre('save', function (next) {
    this.lastActivity = new Date();
    next();
});

// Auto-delete inactive rooms after 24 hours
RoomSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
