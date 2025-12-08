const express = require('express');
const fs = require('fs/promises'); // Use fs/promises for modern async/await
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const cors = require('cors'); // Required for allowing web browser requests

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// --- Middleware ---
app.use(cors()); // Allow all cross-origin requests
app.use(express.json()); // To parse JSON bodies

// --- Helper function to ensure data file exists ---
async function loadLogs() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('data.json not found. Initializing with empty array.');
            return []; // File not found, return empty array
        }
        throw error; // Other errors (like JSON parse error), re-throw
    }
}

// --- API Endpoints ---

// GET /api/logs: Retrieve all time logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await loadLogs();
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Failed to retrieve logs from server.' });
    }
});

// POST /api/logs: Save a new time log
app.post('/api/logs', async (req, res) => {
    try {
        const newLog = req.body;
        if (!newLog.user || !newLog.timeIn || !newLog.hubstaffTime) {
            return res.status(400).json({ message: 'Missing required log fields.' });
        }
        
        const logs = await loadLogs();
        
        // Assign a simple unique ID (using timestamp for simplicity)
        newLog.id = Date.now();
        newLog.timestamp = new Date().toISOString();
        
        logs.push(newLog);

        await fs.writeFile(DATA_FILE, JSON.stringify(logs, null, 2));

        res.status(201).json({ message: 'Log saved successfully', log: newLog });
    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ message: 'Failed to save log to server.' });
    }
});


// --- Server Start ---
module.exports = app;

