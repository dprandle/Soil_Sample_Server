// server/index.js
const express = require('express');
const app = express();
const http = require('http');
const Server = http.createServer(app);
const io = require("socket.io")(Server, { cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] } });
const path = require('path');
const PORT = process.env.PORT || 3001;
//const index = require('./routes/index');

//app.use(index);

var gsocket = {};
const Serial_Port = require('serialport');
const Inter_Byte_Timeout = require('@serialport/parser-inter-byte-timeout')
const devport = new Serial_Port('/dev/ttyACM1');
const ibt_parser = devport.pipe(new Inter_Byte_Timeout({ interval: 50 }))
function Node_Data() {
    this.src_addr = 1;
    this.dest_addr = 1;
    this.data = 2;
}
function Timeslot_Packet() {
    this.frame_ind = 1;
    this.timeslot = 1;
    this.timeslot_mask = 2;
    this.total_node_count = 1;
    this.removed_node_addr = 1;
    this.future = 2;
    this.node_data = new Node_Data();
    this.fwd_data = [new Node_Data(), new Node_Data(), new Node_Data(), new Node_Data(), new Node_Data()];
}

function RTC_Source_Cycles() {
    this.timeslot = 2;
    this.listen = 1;
    this.drift_listen = 1;
    this.frame_extra_drift_listen = 1;
    this.packet_listen = 1;
    this.tx_to_rx_measured_delay = 1;
}

function RTC_Set_Values() {
    this.rx_on = 2;
    this.rx_packet_to_tx = 2;
    this.rx_packet_to_rx = 2;
    this.rx_no_packet_to_tx = 2;
    this.rx_no_packet_to_rx = 2;
    this.rx_no_packet_to_end_frame = 2;
    this.tx_to_rx = 2;
    this.tx_to_end_frame = 2;
    this.timeslot = 2;
}

function Node_Control_Data() {
    this.timeslots_per_frame = 1
    this.startup_listen_frame_count = 1;
    this.sleep_frame_count = 1;
    this.total_node_count = 1;
    this.our_timeslot = 1;
    this.frame_ind = 1;
    this.remove_next_frame = 1;
    this.remove_this_frame = 1;
    this.src_t = new RTC_Source_Cycles();
    this.t = new RTC_Set_Values();
}

var tspacket_temp = new Timeslot_Packet();
var frame_data = new Node_Control_Data();
var node_data = [];
var timeslots = {};

var current_ind = 0;
function recurse_obj_parse(obj, data) {
    for (let [key, value] of Object.entries(obj)) {
        if (typeof (value) === "object") {
            recurse_obj_parse(value, data);
        }
        else {
            let tmpv = value;
            value = 0;
            for (let i = 0; i < tmpv; ++i) {
                value |= data[current_ind] << (i * 8);
                ++current_ind;
            }
            obj[key] = value;
        }
    }
}
ibt_parser.on('data', function (data) {
    if (data.length == 32) {
        recurse_obj_parse(tspacket_temp, data);
        timeslots[tspacket_temp.timeslot] = tspacket_temp;
        tspacket_temp = new Timeslot_Packet();
        current_ind = 0;
    }
    else if (data.length == 49) {
        recurse_obj_parse(frame_data, data);
        for (let i = 0; i < 8; ++i)
        {
            let val = data[current_ind + i*2];
            val |= (data[current_ind + i*2 + 1] << 8);
            node_data.push(val);
        }
        if (Object.keys(gsocket).length !== 0) {
            gsocket.emit("FrameData", frame_data);
            gsocket.emit("NodeData", node_data);
            gsocket.emit("TimeslotData", timeslots);
        }
        frame_data = new Node_Control_Data();
        node_data = [];
        timeslots = {};
        current_ind = 0;
    }
    else {
        console.log("Invalid Data on Serial Port - Skipping");
    }
});

io.on("connection", (socket) => {
    console.log("New client connected");
    gsocket = socket;
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

Server.listen(PORT, () => console.log(`Listening on port ${PORT}`));