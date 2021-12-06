import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
    const [prev_msg, set_prev_msg] = React.useState("");
    const [total_msg, set_total_msg] = React.useState("");

    React.useEffect(() => {
        setInterval(tick, 200);
    })

    function tick() {
        fetch("/api")
            .then((res) => res.json())
            .then((data) => {
                if (data.message !== prev_msg) {
                    set_prev_msg(data.message);
                    set_total_msg(total_msg + '\n' + prev_msg);
                }
            });
    }

    return (
        <div className="App"><text>{total_msg}</text></div>
    );
}

export default App;