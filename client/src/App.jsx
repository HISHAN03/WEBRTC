import React, { useEffect, useRef,useState  } from "react";
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
          urls: ["stun:stun.arbuz.ru:3478", "stun:stun.bahnhof.net:3478"],
        },
      ],
    };
    
  let peerconnection = new RTCPeerConnection(servers);
  
  const send = (selectedUserId) => {
    console.log(`Sending message to user with ID: ${selectedUserId}`);
   const createOffer = async (targetUserId) => {
    await CreatePeerConnection();
    let offer = await peerconnection.createOffer();
    await peerconnection.setLocalDescription(offer);
    console.log("offer set as local description")
    console.log("Offer: " + offer);
    const offerJson = {
      type: "offer",
      offer: offer,
      targetUserId: targetUserId, 
      yourSocketId: socket.id, 
    };
  
    console.log(targetUserId);
    socket.emit("call", JSON.stringify(offerJson)); // Send the modified offerJson
    console.log("Offer sent");
  };
  
    
    createOffer(selectedUserId); // Pass the selectedUserId to the createOffer function.
  };
  



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



    socket.on("userList", (users) => {
      // Update the userList state when the list of connected users changes
      setUserList(users);
      setMySocketId(socket.id);
      console.log("user");
    });



let roomNum=123

  useEffect(() => {
    socket.emit('join', roomNum);
    const init = async () => {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      user1VideoRef.current.srcObject = localStream;
      //createOffer();
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
    console.log("offer")
    //await CreatePeerConnection();
    //const offer = JSON.parse(offerJson);
    await peerconnection.setRemoteDescription(offerJson.offer);
    console.log("offer remote description set");
    const answer = await peerconnection.createAnswer();
    await peerconnection.setLocalDescription(answer);
    console.log("answer local description set");

    console.log(offerJson.targetUserId+"  target user id")
    console.log(offerJson.yourSocketId+"  my user id")

    const answerJson = JSON.stringify({ type: "answer", answer: answer, targetUserId: offerJson.targetUserId, yourSocketId:offerJson.yourSocketId });
    
    socket.emit("answer2", answerJson);
    console.log("Answer sent");
  });


  socket.on('message',(data)=>{
    console.log(data+"hello this is hishan")
  }
  )





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
      <div>
        <h2>Connected Users</h2>
        <ul>
        {userList
            .filter((userId) => userId !== mySocketId) // Step 2: Filter out your own socket.id
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
