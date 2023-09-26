const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000" // frontend location
    }
});

io.on("connection", (socket) => {
    console.log("connection with socket id " + socket.id);
    socket.on("send_move", (data) => {
        socket.broadcast.emit("receive_move", data);
    });    
});


server.listen(3001); // backend is on port 3001