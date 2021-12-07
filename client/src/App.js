import React from "react";
import logo from "./logo.svg";
import "./App.css";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://localhost:3001";


function Timeslot_Element(props) {
    let tab = props?.tab;
    let val = props?.val;
    let keyv = props?.keyv;
    let tabspaces = [];
    for (let i = 0; i < tab; ++i)
        tabspaces.push(<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>);
    if (val !== undefined || typeof (val) === "number")
        return <div className='TimeslotElement'>{tabspaces}{keyv}: {val}</div>;
    else
        return <div className='TimeslotElement'>{tabspaces}{keyv}</div>;

}

function Recurse_Object(source_obj, list, tab_count) {
    for (const prop in source_obj) {
        if (typeof (source_obj[prop]) === "object") {
            list.push(<Timeslot_Element tab={tab_count} key={prop} keyv={prop} />);
            Recurse_Object(source_obj[prop], list, tab_count + 1);
        }
        else {
            list.push(<Timeslot_Element tab={tab_count} key={prop} keyv={prop} val={source_obj[prop]} />);
        }
    }
}

function Timeslot(props) {
    let list = [];
    let tab_count = 0;
    let ts = props?.ts;
    //delete ts?.frame_ind;
    let ins = 'inline-start';
    if (ts)
        Recurse_Object(ts, list, tab_count);
    return (
        <div className='Timeslot' style={{ float: ins }}>{list}</div>
    );
}

function Frame_Title(props) {
    return <div className='FrameTitle'><h1>Frame: {props?.frame_ind}</h1></div>;
}

function Frame(props) {
    let timeslot = props?.timeslots['1'];
    let frame_data = props?.frame_data;
    let frame_ind = frame_data?.frame_ind;
    let timeslots = props?.timeslots;
    let ts_list = [];
    ts_list.push(<Timeslot ts={frame_data} />);
    for (const cur_ts in timeslots) {
        ts_list.push(<Timeslot ts={timeslots[cur_ts]} />);
    }
    return (
        <div className='Frame'>
            <Frame_Title frame_ind={frame_ind} />
            {ts_list}
        </div>
    );
}

function Node_Title(props) {
    return <div className='NodeTitle'>Node: 0x{props?.src_addr.toString(16)}</div>;
}

function Node(props) {
    return <div className="Node">
        <Node_Title src_addr={props?.src_addr}/>
        {props?.node}
    </div>
}

function Nodes(props) {
    let nodes = props?.nodes;
    let timeslots = props?.timeslots;

    let node_list = [];
    for (const tsind in timeslots) {
        let src_addr = timeslots[tsind].node_data.src_addr;
        node_list.push(<Node node={nodes[tsind]} src_addr={src_addr} />);
    }
    return (
        <div className='Nodes'>
            {node_list}
        </div>
    );
}

function App() {
    const [timeslots, set_timeslots] = React.useState("");
    const [node_data, set_node_data] = React.useState("");
    const [frame_data, set_frame_data] = React.useState("");

    React.useEffect(() => {
        const socket = socketIOClient(ENDPOINT);
        socket.on("TimeslotData", data => {
            set_timeslots(data);
        });
        socket.on("NodeData", data => {
            set_node_data(data);
        });
        socket.on("FrameData", data => {
            set_frame_data(data);
        });
    }, []);

    return (
        <div className="App">
            <Frame timeslots={timeslots} frame_data={frame_data} />
            <Nodes nodes={node_data} timeslots={timeslots} />
        </div>
    );
}

export default App;