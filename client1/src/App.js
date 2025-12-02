import './App.css';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

const socket = io("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [room, setRoom] = useState("");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const [password, setPassword] = useState("");

  const joinRoom = () => {
    if (username && roomInput && password) {
      socket.emit("joinRoom", { username, room: roomInput, password });
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("chatMessage", message);
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("roomUsers", (activeUsers) => {
      setUsers(activeUsers);
      setRoom(roomInput);  
    });

    socket.on("IncorrectPassword", () => {
      alert("Incorrect password. Access denied.");
    });

    return () => {
      socket.off("message");
      socket.off("roomUsers");
      socket.off("wrongPassword");
    };
  }, [roomInput]);

  useEffect(() => {
    const box = document.querySelector(".messages");
    box?.scrollTo(0, box.scrollHeight);
  }, [messages]);

  return (
    <div className="App">
      {!room ? (
        <div className="join-page">
          <div className="join-card">
            <h1>Welcome to Chat Rooms</h1>
            <p className="subtitle">Enter room details to begin chatting</p>

            <input
              type="text"
              placeholder="Enter username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter room name"
              onChange={(e) => setRoomInput(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter room password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={joinRoom}>Join Room</button>
          </div>
        </div>
      ) : (
        <div className="chat-container">

          <div className="sidebar">
            <h3>Room: {room}</h3>
            <h4>Active Users</h4>
            {users.map((u, i) => (
              <p key={i}>{u.username}</p>
            ))}
          </div>

          <div className="chat-box">
            <div className="messages">
              {messages.map((m, i) => {
                const isMe = m.username === username;
                const isSystem = m.username === "System";

                return (
                  <div
                    key={i}
                    className={
                      isSystem
                        ? "system-message"
                        : isMe
                        ? "message my-message"
                        : "message other-message"
                    }
                  >
                    {!isSystem && (
                      <span className="sender">
                        {isMe ? "You" : m.username}
                      </span>
                    )}
                    <span className="text">{m.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="input-area">
              <input
                type="text"
                value={message}
                placeholder="Type your message..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
