import { google } from 'googleapis';


// Initialize OAuth2 client
function getOAuth2Client() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    return oauth2Client;
}

/**
 * Create a Google Meet meeting
 * @param {Object} params - Meeting parameters
 * @param {string} params.summary - Meeting title
 * @param {string} params.description - Meeting description
 * @param {string} params.userEmail - User's email for calendar event
 * @param {string} params.accessToken - User's Google access token
 * @returns {Promise<Object>} Meeting details with Meet link
 */
export async function createGoogleMeet({ summary, description, userEmail, accessToken }) {
    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Create a calendar event with Google Meet
        const event = {
            summary: summary || 'CodeEditor Collaboration Session',
            description: description || 'Real-time collaborative coding session',
            start: {
                dateTime: new Date().toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                timeZone: 'UTC',
            },
            attendees: [
                { email: userEmail }
            ],
            conferenceData: {
                createRequest: {
                    requestId: `codeeditor-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 10 }
                ]
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            resource: event,
        });

        const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri;

        return {
            success: true,
            meetLink,
            eventId: response.data.id,
            eventLink: response.data.htmlLink,
            summary: response.data.summary,
            startTime: response.data.start.dateTime,
            endTime: response.data.end.dateTime,
        };
    } catch (error) {
        console.error('Error creating Google Meet:', error);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || error
        };
    }
}

/**
 * Create a Google Meet meeting using service account (no user auth required)
 * @param {Object} params - Meeting parameters
 * @param {string} params.summary - Meeting title
 * @param {string} params.description - Meeting description
 * @param {string} params.roomId - Room ID for the meeting
 * @returns {Promise<Object>} Meeting details with Meet link
 */
export async function createMeetWithServiceAccount({ summary, description, roomId }) {
    try {
        // For service account authentication
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        const event = {
            summary: summary || `CodeEditor Room: ${roomId}`,
            description: description || `Collaborative coding session\nRoom ID: ${roomId}`,
            start: {
                dateTime: new Date().toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
                timeZone: 'UTC',
            },
            conferenceData: {
                createRequest: {
                    requestId: `codeeditor-${roomId}-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            resource: event,
        });

        const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri;

        return {
            success: true,
            meetLink,
            eventId: response.data.id,
            eventLink: response.data.htmlLink,
        };
    } catch (error) {
        console.error('Error creating Meet with service account:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate Google OAuth URL for user authentication
 * @returns {string} OAuth URL
 */
export function getGoogleAuthUrl() {
    const oauth2Client = getOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    return url;
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<Object>} Tokens
 */
export async function getGoogleTokens(code) {
    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        return { success: true, tokens };
    } catch (error) {
        console.error('Error getting tokens:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Simplified Meet creation using direct Meet links
 * This doesn't require OAuth but creates basic Meet rooms
 * @param {string} roomId - Room identifier
 * @returns {Object} Meet link
 */
export function createSimpleMeetLink(roomId) {
    try {
        // Google Meet doesn't allow custom meeting codes
        // We'll use the "new meeting" approach which creates a valid Meet room
        // Users will get a unique Meet link each time

        return {
            success: true,
            meetLink: `https://meet.google.com/new`,
            meetCode: 'new',
            note: 'Creates a new Google Meet room. Share the actual Meet URL with your team after joining.',
            roomId: roomId
        };
    } catch (error) {
        console.error('Error creating simple Meet link:', error);
        return {
            success: false,
            error: error.message,
            meetLink: `https://meet.google.com/new`,
            note: 'Fallback to new meeting'
        };
    }
}
