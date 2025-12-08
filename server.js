// server.js

// 1. Import Dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 2. Initialize the Express App
const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000

// 3. Apply Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse incoming JSON request bodies

// 4. Define a simple Route
app.get('/', (req, res) => {
    res.send('Time Sheet Tracker API is running!');
});

// 5. Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access it at http://localhost:${PORT}`);
});