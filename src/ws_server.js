// const express = require('express');
// const path = require('path');
// const db = require('./config/connection');
// const routes = require('./routes');

// // const app = express();
// // const PORT = process.env.PORT || 3001;


// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // if we're in production, serve client/build as static assets
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
// }

// app.use(routes);

// db.once('open', () => {
//   app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
// });



const webSocketServer = require("websocket").server
const http = require("http");
let userActivity = [];
let host = "none";
const webSocketServerPort = 'ws://159.89.226.140:8050';
// Starts http server and the websocket server.
const server = http.createServer();
server.listen(webSocketServerPort);
const wss = new webSocketServer({
    httpServer: server
});
const typesDef = {
    USER_EVENT: "userevent",
    CONTENT_CHANGE: "contentchange"
}
//all active connections are stored in this object
const clients = {};
const users = {};
let editorContent = null;
// User activity history.



let connected = 0;
// This code generates unique userid for everyuser.
const getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
};

wss.on('request', function (request) {
    var userID = getUniqueID();
    console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');

    // You can rewrite this part of the code to accept only the requests from allowed origin
    const connection = request.accept(null, request.origin);
    clients[userID] = connection;
    console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))

    connection.on('message', function (message) {
        if (message.type === "utf8") {
            console.log("message:", message)
            const recievedData = JSON.parse(message.utf8Data);
            console.log(recievedData)
            
            const json = { type: recievedData.type };
            if (recievedData.action === "load_and_sync") {
                console.log("receved: ", recievedData)

                for (key in clients) {
                    clients[key].sendUTF(message.utf8Data);
                }
            }
            else if (recievedData.type === typesDef.USER_EVENT) {
                users[userID] = recievedData;
                userActivity.push(`${recievedData.username} joined`);
                json.data = { users, userActivity, host };
                for (key in clients) {
                    clients[key].sendUTF(JSON.stringify(json));
                }
            }
            else if (recievedData.type === typesDef.CONTENT_CHANGE) {
                editorContent = recievedData.content;
                json.data = { editorContent, userActivity };

                for (key in clients) {
                    clients[key].sendUTF(JSON.stringify(json));
                }
            }
            else {
                for (key in clients) {
                    clients[key].sendUTF(message.utf8Data);
                }
            }

        }

    });

    connection.on('close', function (connection) {
        connected--
        console.log((new Date()) + " User " + userID + " disconnected.");
        const json = { type: typesDef.USER_EVENT };

        json.data = { users, userActivity };
        delete clients[userID];
        delete users[userID];
        console.log("remaining clients: ", clients)
    });
});