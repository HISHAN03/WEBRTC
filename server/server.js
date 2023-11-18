const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
};

const io = socketIO(server, {
  cors: corsOptions,
});

users = [];

io.on("connection", (socket) => {
  socket.on("join", function (room) {
    socket.join(room);
    console.log("room joined");
  });
  //socket.join(mainRoom);
  users.push(socket.id);
  console.log("list of users  " + users);
  io.emit("userList", users);

  console.log(`A user connected with id ${socket.id}`);

  socket.on("call", (offerJson) => {
    const offer = JSON.parse(offerJson);
    if (offer.type === "offer") {
      const targetSocketId = offer.targetUserId;
      const yourSocketId = offer.yourSocketId;
      console.log("myid : " + yourSocketId);
      console.log("sender id : " + targetSocketId);
      socket.to(targetSocketId).emit("offer", offer);

      if (targetSocketId) {
        console.log(`Offer sent to user with socket.id: ${targetSocketId}`);
      } else {
        console.log("Target user's socket.id not found in the offer.");
      }
    }

    const iceCandidate = offerJson.iceCandidate;
    if (iceCandidate) {
      socket.to(targetSocketId).emit("ice-candidate", {
        targetUserId: targetSocketId,
        yourSocketId: yourSocketId,
        candidate: iceCandidate,
      });
    }
  });

  socket.on("ice-candidate", (data) => {
    const { targetUserId, candidate, yourSocketId } = data;

    // Check if the target user exists in your 'users' object
    if (users[targetUserId]) {
      const targetSocketId = users[targetUserId];

      // Send the ICE candidate to the target user
      io.to(targetSocketId).emit("ice-candidate-from-server", {
        candidate,
        senderSocketId: yourSocketId,
      });
    } else {
      console.log("Target user not found");
      // Handle scenarios where the target user is not found
    }
  });

  socket.on("answer2", (answerJson) => {
    const answerData = JSON.parse(answerJson);
    if (answerData.type === "answer") {
      const targetSocketId = answerData.targetUserId;
      const yourSocketId = answerData.yourSocketId;
      console.log("my id  :" + yourSocketId);
      socket.to(yourSocketId).emit("answer2", answerJson);
      console.log("answer sent to all users except the sender");
    } else {
      console.log("Received data is not of type 'answer'.");
      // Handle the case when the received data is not an answer
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected with id ${socket.id}`);

    const index = users.indexOf(socket.id);
    if (index !== -1) {
      users.splice(index, 1);
    }
    // Emit the updated list of connected users to all clients
    io.emit("userList", users);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
