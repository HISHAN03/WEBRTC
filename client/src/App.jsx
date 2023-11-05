import React, { useEffect, useRef,useState  } from "react";
import socket from "./socket";
function App() {

  let localStream;
  let remoteStream;
  
    const user1VideoRef = useRef(null);
    const user2VideoRef = useRef(null);

  const servers = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ],
  };



  


  let peerconnection = new RTCPeerConnection(servers);

  const CreatePeerConnection = async () => {
    remoteStream = new MediaStream();
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
    peerconnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
    peerconnection.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log("ICE candidate: " + event.candidate);
      }
    };
  };
  useEffect(() => {
    const init = async () => {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      user1VideoRef.current.srcObject = localStream;
      console.log("Working");
      createOffer();
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
    //await CreatePeerConnection();
    //const offer = JSON.parse(offerJson);
    await peerconnection.setRemoteDescription(offerJson.offer);
    console.log("answer remote description set");
    const answer = await peerconnection.createAnswer();
    await peerconnection.setLocalDescription(answer);
    const answerJson = JSON.stringify({ type: "answer", answer: answer });
    socket.emit("answer2", answerJson);
    console.log("Answer sent");
  });

  socket.on("answer2", async (answerJson) => {
    await peerconnection.setRemoteDescription(answerJson.answer);

    console.log("Answer2 set");
  });



  return (
      <>
       <div id="videos">
        <video className="video-player" ref={user1VideoRef} autoPlay />
        <video className="video-player" ref={user2VideoRef} autoPlay />
      </div>
      <div id="user-list">
        <h2>Available Users:</h2>
        <ul>
        <div onClick={()=> selectUser(user)}>

          {usersList
            .filter((user) => user !== myUserId) // Exclude your own username
            .map((user, index) => (
              <li key={index}>{user}</li>
              ))}
              </div>
        </ul>
      </div>
    </>
  );
}

export default App;
