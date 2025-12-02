const express = require('express');
const app = express();

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const users = {};
const roomPasswords = {};     

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ username, room, password }) => {
        if (!username || !room || !password) return;

        if (!roomPasswords[room]) {
            roomPasswords[room] = password;
            console.log(`Password set for room ${room}`);
        }
        else if (roomPasswords[room] !== password) {
            socket.emit("IncorrectPassword");
            return;
        }

        socket.join(room);
        users[socket.id] = { username, room };

        io.to(room).emit("message", {
            username: "System",
            text: `${username} has joined the room.`
        });

        const activeUsers = Object.values(users).filter((u) => u.room === room);
        io.to(room).emit("roomUsers", activeUsers);
    });

    socket.on("chatMessage", (msg) => {
        const user = users[socket.id];
        if (!user) return;

        io.to(user.room).emit("message", {
            username: user.username,
            text: msg,
        });
    });

    socket.on("disconnect", () => {
        const user = users[socket.id];
        if (!user) return;

        const { username, room } = user;
        delete users[socket.id];

        io.to(room).emit("message", {
            username:"System",
            text:`${username} has left the room.`,
        });
        const activeUsers= Object.values(users).filter((u) => u.room === room);
        io.to(room).emit("roomUsers", activeUsers);

        console.log("User disconnected:", socket.id);
    });
});

server.listen(3001, () => {
    console.log("Server is running on port 3001");
});
