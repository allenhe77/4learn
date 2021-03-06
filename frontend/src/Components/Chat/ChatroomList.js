import React, { useEffect, useState } from "react";
import ChatroomListButton from "./ChatroomListButton";
import "./ChatroomList.css";

const ChatroomList = () => {
  const [roomList, setRoomList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      async function fetchData() {
        const databaseResult = await fetch("/chatroomlist");
        const resultObj = await databaseResult.json();
        const tempResult = [];

        // push title into result state

        await resultObj.forEach((element) => {
          tempResult.push(element);
        });

        setRoomList(tempResult);
        setLoading(false);
      }
      fetchData();
    }
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <div className="chatroom-list">
      {<h3>Chatroom Available</h3>}
      {loading ? (
        <p>loading ...</p>
      ) : (
        roomList.map((e) => (
          <ChatroomListButton roomId={e.roomId} chatroomname={e.chatroomName} />
        ))
      )}
    </div>
  );
};

export default ChatroomList;
