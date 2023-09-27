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
    socket.on("join_room", (data, callback) => {
        const roomSize = io.of('/').adapter.rooms.get(data)?.size || 0;
        if (roomSize < 2) {
            socket.join(data);
            if (roomSize == 1) {
                io.sockets.in(data).emit("start_game");
            }
            callback(roomSize); // callback roomSize so they know a) what player they are b) whether to wait for opponent
        }
        else {
            callback(2);
        }
    });

    socket.on("send_move", (data) => {
        socket.to(data.room).emit("receive_move", data);
    });   

    socket.on("send_promotion", (data) => {
        socket.to(data.room).emit("receive_promotion", data);
    });
});


server.listen(3001); // backend is on port 3001