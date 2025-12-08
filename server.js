// server.js

// 1. Import Dependencies
const express = require('express');
const cors = require('cors');
// const bodyParser = require('body-parser'); // body-parser is now built into express

// 2. Initialize the Express App
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Application State (In-Memory Database)
// We'll use a simple array to store time logs temporarily
let timeLogs = [];
let nextLogId = 1;

// 4. Apply Middleware (Using built-in Express parser)
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true })); // Handle form data

// 5. Basic Welcome Route (GET /)
app.get('/', (req, res) => {
    res.send('Time Sheet Tracker API is running! Use /api/logs for time log operations.');
});

// ----------------------------------------------------
// 6. Time Log API Endpoints (CRUD)
// ----------------------------------------------------

// [C] CREATE: Add a new time log
// POST /api/logs
app.post('/api/logs', (req, res) => {
    const { taskName, duration, date } = req.body;

    // Basic Validation
    if (!taskName || !duration || !date) {
        return res.status(400).json({ error: 'Missing required fields: taskName, duration, and date.' });
    }

    const newLog = {
        id: nextLogId++,
        taskName,
        duration, // e.g., 60 (minutes)
        date,     // e.g., "2025-12-08"
        createdAt: new Date().toISOString()
    };

    timeLogs.push(newLog);
    console.log(`New log created: ${newLog.id}`);

    // Respond with the newly created resource (Status 201 Created)
    res.status(201).json(newLog);
});

// [R] READ ALL: Get all time logs
// GET /api/logs
app.get('/api/logs', (req, res) => {
    // Respond with the full list of logs
    res.json(timeLogs);
});

// [R] READ ONE: Get a specific time log by ID
// GET /api/logs/:id
app.get('/api/logs/:id', (req, res) => {
    // Get the ID from the URL parameters (it comes as a string)
    const id = parseInt(req.params.id);
    const log = timeLogs.find(log => log.id === id);

    if (!log) {
        // If no log is found, send a 404 Not Found error
        return res.status(404).json({ error: `Time log with ID ${id} not found.` });
    }

    // Send the found log
    res.json(log);
});


// 7. Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access it at http://localhost:${PORT}`);
});