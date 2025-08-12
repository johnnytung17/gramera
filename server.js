require('dotenv').config();
const path = require('path');
const express = require('express');
const app = require('./server/app');
const connectDatabase = require('./server/config/databaseFallback'); // Use fallback version for SSL issues
const PORT = process.env.PORT || 4000;

// Initialize database connection
const startServer = async () => {
    try {
        await connectDatabase();
        
        // deployment
        __dirname = path.resolve();
        if (process.env.NODE_ENV === 'production') {
            app.use(express.static(path.join(__dirname, '/client/build')))

            app.get('*', (req, res) => {
                res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
            });
        } else {
            app.get('/', (req, res) => {
                res.send('🚀 Gramera Social Media App - Server is Running!');
            });
        }
        
        // Start server only after successful DB connection
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server Running on http://localhost:${PORT}`);
            console.log(`🤖 AI Features: ${process.env.OPENAI_API_KEY ? '✅ Enabled' : '❌ Disabled (No OpenAI key)'}`);
        });

        // ============= socket.io ==============
        const io = require("socket.io")(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:3000",
            }
        });

        let users = [];

        const addUser = (userId, socketId) => {
            !users.some((user) => user.userId === userId) &&
                users.push({ userId, socketId });
        }

        const removeUser = (socketId) => {
            users = users.filter((user) => user.socketId !== socketId);
        }

        const getUser = (userId) => {
            return users.find((user) => user.userId === userId);
        }

        io.on("connection", (socket) => {
            console.log("🚀 Someone connected!");

            // get userId and socketId from client
            socket.on("addUser", (userId) => {
                addUser(userId, socket.id);
                io.emit("getUsers", users);
            });

            // get and send message
            socket.on("sendMessage", ({ senderId, receiverId, content }) => {
                const user = getUser(receiverId);
                io.to(user?.socketId).emit("getMessage", {
                    senderId,
                    content,
                });
            });

            // typing states
            socket.on("typing", ({ senderId, receiverId }) => {
                const user = getUser(receiverId);
                io.to(user?.socketId).emit("typing", senderId);
            });

            socket.on("typing stop", ({ senderId, receiverId }) => {
                const user = getUser(receiverId);
                io.to(user?.socketId).emit("typing stop", senderId);
            });

            // user disconnected
            socket.on("disconnect", () => {
                console.log("⚠️ Someone disconnected")
                removeUser(socket.id);
                io.emit("getUsers", users);
            });
        });

    } catch (error) {
        console.error("💀 Failed to start server:", error.message);
        console.error("\n🔧 Please fix the database connection issue first!");
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    process.exit(1);
});

startServer();