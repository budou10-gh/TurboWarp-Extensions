// Name: Screen Sharing
// ID: screenSharing
// Description: Share your screen and display it over the stage.
// License: None

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Screen Sharing extension must run unsandboxed!");
  }

  let stream = null;
  let video = null;
  let overlay = null;

  // 位置・サイズ用変数
  let x = 0;
  let y = 0;
  let width = 0;   // 0ならステージ全体
  let height = 0;

  function updateVideoStyle() {
    if (!video) return;
    video.style.position = "absolute";
    video.style.left = x + "px";
    video.style.top = y + "px";
    video.style.width = width > 0 ? width + "px" : "100%";
    video.style.height = height > 0 ? height + "px" : "100%";
  }

  function createVideoOverlay() {
    if (video) return;
    video = document.createElement("video");
    video.autoplay = true;
    video.muted = false; // 音声も出す
    updateVideoStyle();
    overlay = Scratch.renderer.addOverlay(video, "manual");
  }

  function removeVideoOverlay() {
    if (video) {
      Scratch.renderer.removeOverlay(video);
      video = null;
      overlay = null;
    }
  }

  class ScreenSharing {
    getInfo() {
      return {
        id: "screenSharing",
        name: "Screen Sharing",
        color1: "#4caf50",
        color2: "#388e3c",
        color3: "#2e7d32",
        blocks: [
          {
            opcode: "startSharing",
            blockType: Scratch.BlockType.COMMAND,
            text: "start screen sharing (with audio)"
          },
          {
            opcode: "stopSharing",
            blockType: Scratch.BlockType.COMMAND,
            text: "stop screen sharing"
          },
          {
            opcode: "isSharing",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "screen sharing active?"
          },
          {
            opcode: "setPosition",
            blockType: Scratch.BlockType.COMMAND,
            text: "set screen sharing position x:[X] y:[Y]",
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
            }
          },
          {
            opcode: "setSize",
            blockType: Scratch.BlockType.COMMAND,
            text: "set screen sharing size width:[WIDTH] height:[HEIGHT]",
            arguments: {
              WIDTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              HEIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
            }
          }
        ]
      };
    }

    async startSharing() {
      if (stream) return;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        createVideoOverlay();
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          this.stopSharing();
        });
      } catch (e) {
        stream = null;
        removeVideoOverlay();
        alert("Screen sharing was cancelled or failed.");
      }
    }

    stopSharing() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      removeVideoOverlay();
    }

    isSharing() {
      return !!stream && stream.active;
    }

    setPosition(args) {
      x = Number(args.X);
      y = Number(args.Y);
      updateVideoStyle();
    }

    setSize(args) {
      width = Number(args.WIDTH);
      height = Number(args.HEIGHT);
      updateVideoStyle();
    }
  }

  Scratch.extensions.register(new ScreenSharing());
})(Scratch);