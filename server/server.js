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

users=[]


io.on("connection", (socket) => {
  socket.on('join', function(room) {
    socket.join(room);
    console.log("room joined")
});
  //socket.join(mainRoom);
  users.push(socket.id)
  console.log("list of users  "+ users)
  io.emit("userList", users);
  
  console.log(`A user connected with id ${socket.id}`);


  socket.on("call", (offerJson) => {
    const offer = JSON.parse(offerJson);
    if (offer.type === "offer") {
      // Extract the target user's socket.id (e.g., from the offer data)
    //  const targetSocketId = offer.targetUserId; 
      const targetSocketId = offer.targetUserId;
      const yourSocketId = offer.yourSocketId;
      console.log("myid : "+yourSocketId)
      console.log("sender id : "+targetSocketId)

// Replace with the actual source of the targetSocketId
      socket.to(targetSocketId).emit("offer", offer);
      
       if (targetSocketId) {
    
       console.log(`Offer sent to user with socket.id: ${targetSocketId}`);
      } else {
         console.log("Target user's socket.id not found in the offer.");
      }
     //}
    }
  });
  

  socket.on("answer2", (answerJson) => {
    const answerJson1 = JSON.parse(answerJson);
    const targetSocketId = answerJson1.targetUserId;
    const yourSocketId = answerJson1.yourSocketId;
    console.log("my id  :"+yourSocketId)
    // Parse the received JSON string back into an object
   // const answer = JSON.parse(answerJson);
    // if (answer.type === "answer") {
      socket.to(yourSocketId).emit("answer2", answerJson1);
      console.log("answer sent to all users except the sender");
    // }
    // console.log('answer is not of type answer')
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
