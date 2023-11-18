import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");
function App() {
  const [mySocketId, setMySocketId] = useState("");
  let localStream;
  let remoteStream;
  const [userList, setUserList] = useState([]);
  const user1VideoRef = useRef(null);
  const user2VideoRef = useRef(null);

  const servers = {
    iceServers: [
      {
        urls: ["stun:stun.ekiga.net", "stun:stun.rixtelecom.se"],
      }
    ],  
  };
  
  remoteStream = new MediaStream();
  const CreatePeerConnection = async () => {
    user2VideoRef.current.srcObject = remoteStream;
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      user1VideoRef.current.srcObject = localStream;
    }
    localStream.getTracks().forEach((track) => {
      peerconnection.addTrack(track, localStream);
    });

    
    peerconnection.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log("ICE candidate: " + event.candidate);
      }
    };
  };
  let peerconnection = new RTCPeerConnection(servers);

  peerconnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      console.log("''''''''''''''''remote track-recieved'''''''''''''")
      remoteStream.addTrack(track); // Ensure remote tracks are added to the remoteStream
    });
  };

  socket.on("ice-candidate", (candidateInfo) => {
    const iceCandidate = new RTCIceCandidate(candidateInfo.candidate);
    peerconnection.addIceCandidate(iceCandidate);
  });

  const send = (selectedUserId) => {
    console.log(`Sending message to user with ID: ${selectedUserId}`);

    const createOffer = async (targetUserId) => {
      await CreatePeerConnection();

      peerconnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log("ICE candidate: " + event.candidate);
          const iceCandidate = event.candidate;
          socket.emit("ice-candidate", {
            targetUserId: targetUserId,
            yourSocketId: socket.id,
            candidate: iceCandidate,
          });
        }
      };
  

      let offer = await peerconnection.createOffer();
      await peerconnection.setLocalDescription(offer);
      console.log("offer set as local description");
      console.log("Offer: " + offer);
      console.log(offer+"offer")
      console.log(offer.sdp)
      console.log(offer.type+"type")


      let sdp=offer.sdp
      const offerJson = {
        
        type: "offer",
        offer: sdp,
        targetUserId: targetUserId,
        yourSocketId: socket.id,
      };

      console.log(targetUserId);
      socket.emit("call", JSON.stringify(offerJson));
      console.log("Offer sent");
    };

    createOffer(selectedUserId);
  };
  socket.on("ice-candidate-from-server", ({ candidate }) => {
    console.log("Received ICE candidate from server");
    // Add the received ICE candidate to the peer connection
    peerconnection.addIceCandidate(candidate);
  });








  socket.on("userList", (users) => {
    setUserList(users);
    setMySocketId(socket.id);
    console.log("user");
  });

  let roomNum = 123;

  useEffect(() => {
    socket.emit("join", roomNum);
    const init = async () => {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      user1VideoRef.current.srcObject = localStream;
    };

    const createOffer = async () => {
      await CreatePeerConnection();
      let offer = await peerconnection.createOffer();
      await peerconnection.setLocalDescription(offer);
      console.log("Offer: " + offer);
      const offerJson = JSON.stringify({ type: "offer", offer: offer });
      socket.emit("call", offerJson);
      console.log("offer sent");
    };

    init();
  }, []);

  socket.on("offer", async (offerJson) => {
    if (offerJson.type === "offer") {
      console.log("offer");
      await peerconnection.setRemoteDescription(offerJson.offer);
      console.log("offer remote description set");
      const answer = await peerconnection.createAnswer();
      await peerconnection.setLocalDescription(answer);
      console.log("answer local description set");
      console.log(offerJson.targetUserId + "  target user id");
      console.log(offerJson.yourSocketId + "  my user id");
      const answerJson = JSON.stringify({
        type: "answer",
        answer: answer.sdp,
        targetUserId: offerJson.targetUserId,
        yourSocketId: offerJson.yourSocketId,
      });
      socket.emit("answer2", answerJson);
  
      console.log("Answer sent");
    } else {
      console.log("Received data is not of type 'offer'.");
      // Handle the case when the received data is not an offer
    }
  });
  

  socket.on("message", (data) => {
    console.log(data + "hello this is hishan");
  });

  socket.on("answer2", async (answerJson) => {
    const answerData = JSON.parse(answerJson);
    if (answerData.type === "answer") {
      await peerconnection.setRemoteDescription(answerData.answer);
      console.log("Answer2 set");
    } else {
      console.log("Received data is not of type 'answer'.");
      // Handle the case when the received data is not an answer
    }
  });
  

  return (
    <>
      <div id="videos">
        <video className="video-player" ref={user1VideoRef} autoPlay />
        <video className="video-player" ref={user2VideoRef} autoPlay />
      </div>
      <div>
        <h2>Connected Users</h2>
        <ul>
          {userList
            .filter((userId) => userId !== mySocketId)
            .map((userId) => (
              <li key={userId} onClick={() => send(userId)}>
                User ID: {userId}
              </li>
            ))}
        </ul>
      </div>
    </>
  );
}

export default App;
