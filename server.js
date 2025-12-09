// server.js (UPDATED CODE)
const express = require('express');
const cors = require('cors'); // --- 1. Import CORS ---
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000; 
const DATA_FILE = path.join(__dirname, 'timelogs.json');

// --- 2. Apply CORS Middleware ---
app.use(cors()); 

// Middleware to parse JSON bodies
app.use(express.json());

// --- File System Utility Functions ---

function readTimeLogs() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        // Safely parse JSON or return an empty array if the file is empty/invalid
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
        fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing time logs file:', error);
    }
}

function findMaxId(logs) {
    // Ensures IDs are unique, using timestamp as a fallback if no explicit ID exists
    return logs.reduce((max, log) => Math.max(max, log.id || 0), 0);
}

let timeLogs = readTimeLogs();
let nextId = findMaxId(timeLogs) + 1;


// --- API Routes ---

// [R] GET All Logs
app.get('/api/logs', (req, res) => {
    res.status(200).json(timeLogs);
});

// [C] POST a New Log (--- 3. Updated Log Fields ---)
app.post('/api/logs', (req, res) => {
    // Expect the fields sent by index.html
    const { user, timeIn, timeOut, hubstaffTime, remarks } = req.body; 

    // Basic validation based on frontend requirements
    if (!user || !timeIn || hubstaffTime === undefined) {
        return res.status(400).json({ error: 'Missing required fields: user, timeIn, and hubstaffTime are required.' });
    }

    const newLog = {
        id: nextId++,
        user,
        timeIn,
        timeOut: timeOut || 'N/A', 
        hubstaffTime: Number(hubstaffTime),
        remarks: remarks || '',
        timestamp: new Date().toISOString()
    };

    timeLogs.push(newLog);
    writeTimeLogs(timeLogs);
    // Respond with an object that contains the log object, as the frontend expects { log: ... }
    res.status(201).json({ message: 'Log created successfully', log: newLog }); 
});

// [U] PUT (Update) a Log by ID (Simplified to match GET/POST structure)
app.put('/api/logs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const logIndex = timeLogs.findIndex(log => log.id === id);

    if (logIndex === -1) {
        return res.status(404).json({ error: 'Log not found.' });
    }
    
    // Apply updates only for allowed fields
    const updatedLogData = {
        user: req.body.user,
        timeIn: req.body.timeIn,
        timeOut: req.body.timeOut,
        hubstaffTime: Number(req.body.hubstaffTime),
        remarks: req.body.remarks,
    };
    
    // Merge the current log with the new data
    const updatedLog = {
        ...timeLogs[logIndex],
        ...updatedLogData,
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

// Start the server (Vercel ignores this for serverless, but it's good practice)
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});