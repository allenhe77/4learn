const express = require("express");
const app = express();
const http = require("http").Server(app);
const insertDb = require("./insertdb");
const searchDb = require("./searchdb");
const insertQuestion = require("./insertquestion");
const getQuestion = require("./getquestion");
const answerQuestion = require("./answerquestion");
const queryWorkspace = require("./querworkspace");
const createChatroom = require("./createchatroom");
const getChatroomList = require("./getchatroomlist");
const getQuestionList = require("./getquestionlist");
const saveUserWork = require("./saveuserwork");
const hostAddQuestion = require("./hostaddquestion");
const adminQuestion = require("./adminquestion");
const adminDeletequestion = require("./admindeletequestion");
const adminViewquestion = require("./adminviewquestion");
const uploadResource = require("./uploadresource");
const getResource = require("./getresource");
const resourceRate = require("./resourcerate");
const path = require("path");

const auth = require("./auth");
const jwt = require("jsonwebtoken");
const io = require("socket.io")(http);
const { v4: uuidv4 } = require("uuid");

const md5 = require("md5");
const jwt_decode = require("jwt-decode");
const querworkspace = require("./querworkspace");
const { link } = require("fs");

require("dotenv").config();

app.use(
  express.urlencoded({
    extended: true,
  }),
  express.json()
);

const PORT = process.env.PORT || 5000;

// app.get("/", (req, res) => {
//   res.send("you are at backend root");
// });

// websocket io for chatroom
io.on("connection", (socket) => {
  console.log("user connected");
  let room = socket.handshake.query.room;
  socket.join(room);

  // socket.on("clientmessage", (data) => {
  //   console.log(data.message);
  //   console.log(jwt.decode(data.from));
  //   socket.broadcast.emit("broadcast", {
  //     message: data.message,
  //     from: jwt.decode(data.from).username,
  //   });
  // });

  socket.on("chat-message", (data) => {
    socket.to(room).emit("message", {
      message: data.message,
      from: jwt.decode(data.from).userName,
    });

    console.log(jwt.decode(data.from).userName);
  });

  // socket.on("join-chat", (userId) => {
  //   socket.broadcast.emit("user-joined", userId);
  //   console.log(userId);
  // });
  // setTimeout(
  //   () => socket.emit("server-message", { message: "message from server" }),
  //   5000
  // );
  // setTimeout(
  //   () => socket.emit("server-message", { message: "message2 from server" }),
  //   10000
  // );

  socket.on("disconnect", () => {
    socket.leave(room);
    console.log("user disconnected");
  });
});

// websocket io for chatroom ends

app.post("/register", async (req, res) => {
  try {
    const result = await insertDb(
      req.body.name,
      req.body.email,
      md5(req.body.password)
    ).catch(console.dir);
    if (result) {
      let payload = { userName: req.body.name };
      console.log(payload);

      let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5d",
      });
      res.cookie("access-token", accessToken, { maxAge: 600000000 });
      res.redirect("/chatroomoverview");
    } else {
      res.send("registration failed");
    }
  } catch (error) {}
});

//middleware auth, login path not working

//disable auth middleware for now
// app.use("/login", auth);

app.post("/login", async (req, res) => {
  try {
    const loginInfo = await searchDb(req.body.email, md5(req.body.password));

    // let username = req.body.email;
    // let password = req.body.password;
    let payload = { userName: loginInfo };
    console.log(payload);

    let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "5d",
    });

    //users[username].refreshToken = refreshToken;
    res.cookie("access-token", accessToken, { maxAge: 600000000 });
    res.redirect("/chatroomoverview");
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

app.put("/askquestion", async (req, res) => {
  const tags = {
    oAlevel: req.body.oAlevel,
    subject: req.body.subject,
    year: req.body.year,
    paperNumber: req.body.paperNumber,
    month: req.body.month,
    questionNumber: req.body.questionNumber,
  };
  const result = await insertQuestion(
    req.body.title,
    req.body.area,
    req.body.detail,
    tags
  );
  const deleteResult = await adminDeletequestion(req.body.id);
  result
    ? res.redirect("/admin")
    : res.send("there was an error while posting");
});

app.get("/adminviewquestion", async (req, res) => {
  const data = [];
  const result = await adminViewquestion(data);

  res.json(result);
});

app.post("/adminquestion", async (req, res) => {
  const tags = {
    oAlevel: req.body.oalevel,
    subject: req.body.subject,
    year: req.body.year,
    paperNumber: req.body.paperNumber,
    month: req.body.month,
    questionNumber: req.body.questionNumber,
  };
  console.log(req.body.id);

  const result = await adminQuestion(
    req.body.title,
    req.body.area,
    req.body.detail,
    tags
  );

  result
    ? res.redirect("/answerquestion")
    : res.send("there was an error while posting");
});

app.delete("/admindeletequestion", async (req, res) => {
  const result = await adminDeletequestion(req.body.id);

  res.redirect("/admin");
});

app.get("/answerquestion", async (req, res) => {
  const data = [];
  const result = await getQuestion(data);

  res.json(result);
});

app.put("/answerquestion", async (req, res) => {
  const id = req.body.id;
  const userName = jwt_decode(req.body.userName).userName;
  const answer = req.body.answer;
  console.log(answer, userName, id);

  const result = await answerQuestion(answer, userName, id);

  res.send("answer received");
});

app.get("/queryworkspace", async (req, res) => {
  const data = [];
  const result = await queryWorkspace(data);
  console.log(result);
  res.json(result);
});

app.post("/createchatroom", async (req, res) => {
  const roomId = uuidv4();
  const userToken = req.body.createdBy;
  const createdBy = jwt_decode(userToken).userName;
  console.log(req.body.roomName);

  const result = await createChatroom(roomId, req.body.roomName, createdBy);
  result ? res.redirect(`/chatroomoverview`) : res.send("failed");
});

app.get("/enterchatroom/:roomId/:roomName/:userToken", (req, res) => {
  const roomId = req.params.roomId;
  const userToken = req.params.userToken;
  const roomName = req.params.roomName;
  console.log(userToken);
  const userName = jwt_decode(userToken).userName;
  console.log(userName);

  //send client roomid and username entering the chatroom

  res.redirect(`/chatroom/${roomId}/${roomName}/${userName}`);
});

app.get("/chatroomlist", async (req, res) => {
  const data = [];
  const result = await getChatroomList(data);
  res.json(result);
});

app.get(`/getworkspacequestions/:roomId`, async (req, res) => {
  const data = [];
  const roomId = req.params.roomId;
  const result = await getQuestionList(data, roomId);

  const questions = result[0].questions;

  res.json(questions);
});

app.post(
  `/usersavework/:roomId/:currentQuestion/:userName`,
  async (req, res) => {
    userWork = req.body.userWork;
    const roomId = req.params.roomId;
    const currentQ = req.params.currentQuestion;
    const userName = req.params.userName;
    result = await saveUserWork(roomId, currentQ, userName, userWork);
    console.log(result);
    res.send("siccess");
  }
);

app.post("/hostaddquestion/:roomId", async (req, res) => {
  const roomId = req.params.roomId;
  const question = req.body.questionNumber;

  result = await hostAddQuestion(roomId, question);
  console.log(result);
  res.send("added");
});

app.post("/resourceupload", async (req, res) => {
  console.log("request received");
  const link = req.body.link;
  const linkName = req.body.linkName;

  const userName = jwt_decode(req.body.userName).userName;
  const result = await uploadResource(userName, link, linkName);

  res.send("success");
});

app.get("/getresource", async (req, res) => {
  const data = [];
  const result = await getResource(data);
  console.log(result);
  res.json(data);
});

app.put("/resourcerate", async (req, res) => {
  const rate = req.body.rate;
  const userName = req.body.userName;
  const id = req.body.id;
  console.log(id);
  const result = await resourceRate(id, rate);
  res.send("asd");
});

app.post("/adminlogins", (req, res) => {
  console.log();
  if (req.body.password === process.env.ADMINPASS) {
    res.redirect("/admin");
  } else {
    res.send("Invalid Credentials");
  }
});

//serve static assets in production

if (process.env.NODE_ENV === "production") {
  app.use(express.static("frontend/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}

http.listen(PORT, (req, res) => {
  console.log(`listening on ports ${PORT}`);
});
