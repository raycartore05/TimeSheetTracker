const express = require('express');
const fs = require('fs'); // <--- New: File System module
const path = require('path');
const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'timelogs.json'); // Path to your data file

// Middleware to parse JSON bodies
app.use(express.json());

// --- File System Utility Functions ---

/**
 * Reads time logs from the JSON file.
 * @returns {Array} An array of time logs.
 */
function readTimeLogs() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        // If file is empty, return an empty array
        return data ? JSON.parse(data) : [];
    } catch (error) {
        // If file doesn't exist (first run), return an empty array
        if (error.code === 'ENOENT') {
            console.log('Data file not found. Starting with an empty array.');
            return [];
        }
        console.error('Error reading time logs file:', error);
        return [];
    }
}

/**
 * Writes the time logs array back to the JSON file.
 * @param {Array} logs - The array of time logs to write.
 */
function writeTimeLogs(logs) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing time logs file:', error);
    }
}

// Initialize timeLogs array from the file upon server start
let timeLogs = readTimeLogs();

// --- Helper to Generate New ID ---
function generateId(logs) {
    const maxId = logs.reduce((max, log) => Math.max(max, log.id), 0);
    return maxId + 1;
}

// --- API Routes ---

// [R] GET All Logs
app.get('/api/logs', (req, res) => {
    res.status(200).json(timeLogs);
});

// [C] POST a New Log
app.post('/api/logs', (req, res) => {
    const { taskName, duration, date } = req.body;

    if (!taskName || duration === undefined || !date) {
        return res.status(400).json({ error: 'Missing required fields: taskName, duration, and date are required.' });
    }

    const newLog = {
        id: generateId(timeLogs),
        taskName,
        duration: Number(duration),
        date,
        createdAt: new Date().toISOString()
    };

    timeLogs.push(newLog);
    writeTimeLogs(timeLogs); // <--- New: Persist data
    res.status(201).json(newLog);
});

// [U] PUT (Update) a Log by ID
app.put('/api/logs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const logIndex = timeLogs.findIndex(log => log.id === id);

    if (logIndex === -1) {
        return res.status(404).json({ error: 'Log not found.' });
    }

    // Create a new updated log object
    const updatedLog = {
        ...timeLogs[logIndex],
        ...req.body,
        id: id, // Ensure ID remains unchanged
        updatedAt: new Date().toISOString()
    };

    timeLogs[logIndex] = updatedLog;
    writeTimeLogs(timeLogs); // <--- New: Persist data
    res.status(200).json(updatedLog);
});

// [D] DELETE a Log by ID
app.delete('/api/logs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = timeLogs.length;

    // Filter out the log with the matching ID
    timeLogs = timeLogs.filter(log => log.id !== id);

    if (timeLogs.length === initialLength) {
        return res.status(404).json({ error: 'Log not found.' });
    }

    writeTimeLogs(timeLogs); // <--- New: Persist data
    res.status(204).send(); // 204 No Content for successful deletion
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});