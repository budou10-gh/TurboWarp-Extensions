// Name: Screen Sharing
// ID: screenSharing
// Description: Share your screen and display it over the stage.
// License: MIT

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

  let recordingMediaRecorder = null;
  let recordingChunks = [];
  let lastScreenVideoBase64 = "";

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
          },
          {
            opcode: "startScreenRecording",
            blockType: Scratch.BlockType.COMMAND,
            text: "start screen sharing recording"
          },
          {
            opcode: "stopScreenRecording",
            blockType: Scratch.BlockType.COMMAND,
            text: "stop screen sharing recording"
          },
          {
            opcode: "getScreenRecordingBase64",
            blockType: Scratch.BlockType.REPORTER,
            text: "get screen sharing video as Base64 URL"
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

    startScreenRecording() {
      if (!stream) return;
      if (recordingMediaRecorder && recordingMediaRecorder.state === "recording") return;
      recordingChunks = [];
      recordingMediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recordingMediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) recordingChunks.push(e.data);
      };
      recordingMediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunks, { type: "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          lastScreenVideoBase64 = reader.result; // data:video/webm;base64,...
        };
        reader.readAsDataURL(blob);
      };
      recordingMediaRecorder.start();
    }

    stopScreenRecording() {
      if (recordingMediaRecorder && recordingMediaRecorder.state === "recording") {
        recordingMediaRecorder.stop();
      }
    }

    getScreenRecordingBase64() {
      return lastScreenVideoBase64 || "";
    }
  }

  Scratch.extensions.register(new ScreenSharing());
})(Scratch);