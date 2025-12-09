// api/index.js
const express = require('express');
const fs = require('fs/promises'); // Use fs/promises for modern async/await
const path = require('path'); // <--- CRITICAL FIX: Importing the path module
const cors = require('cors'); // Required for allowing web browser requests

const app = express();
const PORT = process.env.PORT || 3000;

// Corrected DATA_FILE path
// On Vercel, __dirname is /var/task/api, so we use '..' to step up to the project root.
const DATA_FILE = path.join(__dirname, '..', 'timelogs.json'); 

// --- Middleware ---
app.use(cors()); // Allow all cross-origin requests
app.use(express.json()); // To parse JSON bodies

// --- Helper function to ensure data file exists ---
// WARNING: This file-based persistence will NOT work on Vercel long-term.
// It is included here only to make the script runnable.
async function loadLogs() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        // Handle case where file might exist but be empty
        return data.trim() ? JSON.parse(data) : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('timelogs.json not found. Initializing with empty array.');
            return []; // File not found, return empty array
        }
        // If it's a JSON parse error, it will throw, which is okay for now.
        throw error; 
    }
}

// Helper function to write logs
async function writeLogs(logs) {
    // Note: Writing to the filesystem is highly discouraged in Vercel.
    await fs.writeFile(DATA_FILE, JSON.stringify(logs, null, 2));
}

// --- API Endpoints (CRUD) ---

// [R] GET /api/logs: Retrieve all time logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await loadLogs();
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Failed to retrieve logs from server.' });
    }
});

// [C] POST /api/logs: Save a new time log
app.post('/api/logs', async (req, res) => {
    try {
        const { user, timeIn, timeOut, hubstaffTime, remarks } = req.body;
        
        // Basic validation
        if (!user || !timeIn || hubstaffTime === undefined) {
             return res.status(400).json({ message: 'Missing required log fields (user, timeIn, hubstaffTime).' });
        }
        
        const logs = await loadLogs();
        
        const newLog = {
            id: Date.now(), // Simple unique ID
            user,
            timeIn,
            timeOut: timeOut || 'N/A', 
            hubstaffTime: Number(hubstaffTime),
            remarks: remarks || '',
            timestamp: new Date().toISOString()
        };
        
        logs.push(newLog);

        await writeLogs(logs);

        // Respond with an object that contains the log object, as the frontend expects { log: ... }
        res.status(201).json({ message: 'Log created successfully', log: newLog });
        
    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ message: 'Failed to save log to server.' });
    }
});


// Note: PUT/DELETE routes are usually added here but are omitted for simplicity 
// in this basic template. Your original code's PUT/DELETE logic was in the 
// first `server.js` file you provided, but the simplified version you sent later 
// only included GET and POST. Assuming you only need the essential routes now.

// --- Server Start/Export ---
// Export the app for Vercel Serverless Function deployment
module.exports = app;

// Local development only (Vercel ignores this)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}