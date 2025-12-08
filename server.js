const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'timelogs.json');

// Middleware to parse JSON bodies
app.use(express.json());

// --- File System Utility Functions ---

function readTimeLogs() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Data file not found. Starting with an empty array.');
            return [];
        }
        console.error('Error reading time logs file:', error);
        return [];
    }
}

function writeTimeLogs(logs) {
    try {
        // Write data with 2 spaces for readability
        fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing time logs file:', error);
    }
}

// --- Optimization: Helper to Find Max ID ---
function findMaxId(logs) {
    // Finds the largest existing ID or returns 0 if the array is empty
    return logs.reduce((max, log) => Math.max(max, log.id), 0);
}

// Initialize timeLogs array from the file upon server start
let timeLogs = readTimeLogs();

// --- Optimization: Global Counter Variable ---
// The next ID to be assigned will be 1 greater than the maximum existing ID.
let nextId = findMaxId(timeLogs) + 1;


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
        id: nextId++, // Use current nextId then immediately increment for the next request
        taskName,
        duration: Number(duration),
        date,
        createdAt: new Date().toISOString()
    };

    timeLogs.push(newLog);
    writeTimeLogs(timeLogs);
    res.status(201).json(newLog);
});

// [U] PUT (Update) a Log by ID
app.put('/api/logs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const logIndex = timeLogs.findIndex(log => log.id === id);

    if (logIndex === -1) {
        return res.status(404).json({ error: 'Log not found.' });
    }

    const updatedLog = {
        ...timeLogs[logIndex],
        ...req.body,
        id: id, 
        updatedAt: new Date().toISOString()
    };

    timeLogs[logIndex] = updatedLog;
    writeTimeLogs(timeLogs);
    res.status(200).json(updatedLog);
});

// [D] DELETE a Log by ID
app.delete('/api/logs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = timeLogs.length;

    timeLogs = timeLogs.filter(log => log.id !== id);

    if (timeLogs.length === initialLength) {
        return res.status(404).json({ error: 'Log not found.' });
    }

    writeTimeLogs(timeLogs);
    res.status(204).send();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});