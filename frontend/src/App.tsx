import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { token: document.cookie.split("=")[1] },
  autoConnect: false, // Prevents auto-connection until manually connected
});

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.connect(); // Manually connect on component mount

    socket.on("newMessage", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("forceLogout", () => {
      alert("You have been logged out due to login from another device.");
      window.location.href = "/login";
    });

    return () => {
      socket.off("newMessage");
      socket.off("forceLogout");
      socket.disconnect(); // Disconnect when component unmounts
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Real-Time Chat</h1>
        <div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
        <div>
          <h2>Messages</h2>
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>{msg.userId}: {msg.message}</li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;