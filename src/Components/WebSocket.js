import React, { Component, useContext } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import ChatBox from "./Chatbox"
import Youtube from "react-youtube";


const tempLinks = [
  {
    title: "Wintergatan - Marble Machine (music instrument using 2000 marbles)",
    id: "IvUU8joBb1Q",
    source: "https://www.youtube.com/watch?v=IvUU8joBb1Q"
  }
]
let player;
let video = "";
const options = {
  height: '390',
  width: '100%',
  playerVars: {
    autoplay: 0,
    rel: 0,
    controls: 1,
    modestbranding: 1
  },
};
var HOST = process.env.WEBSOCKET || 'ws://127.0.0.1:8050';
const client = new W3CWebSocket(HOST);

class WebSocket extends Component {


  constructor(props) {
    super(props);
    console.log("props", props)

    this.state = {
      opts: options,
      isPlaying: false,
      videoId: "uLF6VFME2jc",
      player: "",
      videoUrl: "",
      channel: "",
      chat: [
      ],

      sendchat: "",
      currentUsers: [],
      userActivity: [],
      username: "null",
      text: '',
      textcolor: "",
      chatInput: "",
      host: "",


    };
    this.handleInput = this.handleInput.bind(this)
    this.handleChannel = this.handleChannel.bind(this)
    this.handleChatInput = this.handleChatInput.bind(this)

  }

  numberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  //logs user in using login info or generates guest name
  logInUser = (user) => {
    console.log("username", user)

    const s4 = () => Math.floor((2 + Math.random()) * 0x10000).toString(16).substring(1);
    const username = this.co || "guest-" + s4();


    const textcolor = this.numberBetween(0, 50)
    if (username.trim()) {
      const data = {
        username,
        textcolor,

      };
      this.setState({
        ...data
      }, () => {
        client.send(JSON.stringify({
          ...data,
          type: "userevent"
        }));
      });
    }
  }
  loadLink = (thelink) => {
    let conid = this.state.channel
    client.send(JSON.stringify({
      type: "message",
      action: "load_and_sync",
      data: thelink,
      connectionId: conid
    }));
  }
  //checks if url input is a youtube link.
  //sends link save request to parent
  saveLink = () => {
    if (this.state.videoUrl.match(/(?<=v=)[a-z0-9-_]*/i)) {
      console.log("saving link!");
      this.props.saveRequest()
    }
    else {
      console.log("invalid youtube youtube link")
    }
  }
  sendVideoSrc = () => {
    if (this.state.videoUrl !== "") {
      const videoId = this.state.videoUrl.match(/(?<=v=)[a-z0-9-_]*/i)
      const conid= this.state.channel
      client.send(JSON.stringify({
        type: "message",
        action: "load_and_sync",
        data: {videoId:videoId,
          connectionId: conid
        }
          
        
      }));

      console.log("attempting to send", videoId)
    }
  }
  playVideo = (action) => {
    let conid = this.state.channel
    client.send(JSON.stringify({
      type: "message",
      action: action,
      data: {
        connectionId: conid
      },
      
    }));
    console.log("attempting to play")
  }
  componentWillMount() {

    console.log("user", this.props)
    client.onopen = () => {
      console.log('WebSocket Client Connected');
      this.logInUser(this.componentWillReceiveProps)
    };

    //when message is recieved
    client.onmessage = (message) => {
      const stateToChange = {}
      const serverData = JSON.parse(message.data);
      if (serverData.type === "userevent") {
        stateToChange.currentUsers = Object.values(serverData.data.users);
        stateToChange.host = Object.values(serverData.data.host)
      } else if (serverData.type === "contentchange") {
        stateToChange.text = serverData.data.editorContent || "hi";
      }
      stateToChange.userActivity = serverData.data.userActivity;
      this.setState({
        ...stateToChange
      });
      console.log(this.state.username)
      if (serverData.data.connectionId === this.state.channel) {
        switch (serverData.action) {
          case "load_and_sync":
            console.log("sending load request")
            this.setState({ videoId: serverData.data.videoId })

            break;
          case "sync_start":
            console.log("syncing")

            break;
          case "play":
            player.playVideo()
            console.log("time", player.getCurrentTime())
            this.setState({
              isPlaying: true
            })
            break;
          case "chat":
            const oldarray = this.state.chat.reverse()
            const newarray = oldarray.concat(serverData.data).reverse()

            this.setState({ chat: newarray })
            break;
          case "pause":

            player.pauseVideo()
            this.setState({
              isPlaying: false
            })


        }
      }
      else{console.log(this.state.channel+" is not "+serverData.data.connectionId)}
      console.log("reply received: ", serverData)
    }

  };

  //updates chat input
  updateChat() {

    if (this.state.sendchat !== "") {
      console.log("sending " + this.state.sendchat)
      client.send(JSON.stringify({
        type: "message",
        action: "chat",
        data: {
          user: this.state.username,
          text: this.state.sendchat,
          textcolor: this.state.textcolor
        }
      }));
      if (this.state.chatInput !== "") {
        this.state.chatInput.value = ""
        this.setState({ sendchat: "" })

      }

    }

  }
  gettime() {
    console.log("time", player.getCurrentTime())
  }
  //logs video player status
  _onStateChange(event) {
    console.log(event)
    if (event.data === 5) {
      player.seekTo({ seconds: 0, allowSeekAhead: true })
      player.pauseVideo()
    }
    if (event.data === 1) {

    }
  }
  //when player loads
  _onReady(event) {
    player = event.target;
    player.seekTo({ seconds: 1, allowSeekAhead: true })
    player.pauseVideo()


  }
  //sends chat if enter is pressed
  _handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.updateChat()
    }
  }
  handleChatInput(event) {

    this.setState({
      sendchat: event.target.value,
      chatInput: event.target
    })
  }
  handleInput(event) {
    this.setState({ videoUrl: event.target.value }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.videoUrl)
      }
    })
  }
  handleChannel(event) {
    this.setState({ channel: event.target.value }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.videoUrl)
      }
    })
  }
  render(props) {
    let usernames = "tester"
    let controls
    let savedLinks
    //if logged in render player controls
    if (usernames) {
      controls = <div>
        <div className="input-group col-12 px-0 mb-1">
          <input onChange={this.handleInput} className="form-control" />
          <div className="input-group-append">
            <button onClick={() => this.sendVideoSrc()} className="btn btn-light btn-outline-dark">load Youtube URL</button>
            <button onClick={() => this.saveLink()} className="btn btn-light btn-outline-dark">Save URL</button>
          </div>

        </div>
        <div className="input-group col-3 px-0 mb-1">
          <input onChange={this.handleChannel} className="form-control" />
          <div className="input-group-append">
            <button onClick={() => this.sendVideoSrc()} className="btn btn-light btn-outline-dark">set channel</button>
            
          </div>

        </div>

        <div className="input-group">
          <button onClick={() => this.playVideo("play")} className="btn btn-light btn-outline-dark ">Play </button>
          <button onClick={() => this.playVideo("pause")} className="btn btn-light btn-outline-dark ">Pause </button>
        </div>


      </div>
    }
    else {
      controls = <div></div>
    }
    return (

      <div className="container row mt-3 " >
        <div className="col-md-9 px-0">
          <Youtube
            videoId={this.state.videoId}
            opts={this.state.opts}
            onStateChange={this._onStateChange}
            onReady={this._onReady}
          />
          {controls}
        </div>
        <div className="col-lg-3 px-0 mx-0">
          <ChatBox chatContents={this.state.chat} />
          <div className="input-group ">
            <input onChange={this.handleChatInput} onKeyDown={this._handleKeyDown} className="form-control" />
            <div className="input-group-append">
              <button onClick={() => this.updateChat()} className="btn btn-light btn-outline-dark">send</button>
            </div>
          </div>
        </div>





      </div>

    );
  }

}
export default WebSocket;

// componentWillMount() {
  //   client.onopen = () => {
  //     console.log('WebSocket Client Connected');
  //   };
  //   client.onmessage = (message) => {
  //     const serverData = JSON.parse(message.data);

  //     switch (serverData.action) {
  //       case "load_and_sync":
  //         console.log("sending load request")
  //         this.setState({ videoId: serverData.data })

  //         break;
  //       case "sync_start":
  //         console.log("syncing")

  //         break;
  //       case "play":
  //         player.playVideo()

  //     }

  //     console.log("reply received: ", serverData)
  //   }

  // };