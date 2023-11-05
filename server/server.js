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

io.on("connection", (socket) => {
  console.log(`A user connected with id ${socket.id}`);

  socket.on("call", (offerJson) => {
    const offer = JSON.parse(offerJson);
    if (offer.type === "offer") {
      socket.broadcast.emit("offer", offer);
      console.log("Offer sent to all users except the sender");
    }
  });


  socket.on("answer2", (answerJson) => {
    // Parse the received JSON string back into an object
    const answer = JSON.parse(answerJson);
    if (answer.type === "answer") {
      socket.broadcast.emit("answer2", answer);
      console.log("answer sent to all users except the sender");
    }
    // console.log('answer is not of type answer')
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected with id ${socket.id}`);
    
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
