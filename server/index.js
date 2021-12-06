// server/index.js
const path = require('path');
const express = require('express');
const serport = require('serialport');
const readline_parser = require('@serialport/parser-readline');
const PORT = process.env.PORT || 3001;
const app = express();

const devport = new serport('/dev/ttyACM1');
const rlparser = new readline_parser();
devport.pipe(rlparser);
var msg = "No data";
rlparser.on('data', function (data) { msg = data; console.log(msg); });

// // Switches the port into "flowing mode"
// devport.on('data', function (data) {
//     console.log('Data:', data.to_string())
//   })

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get("/api", (req, res) => {
    res.json({ message: msg });
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});