//framework variables
var statsFlag = false;
var inCallFlag = false;
var canvasFPS = 0;
var lastCalledTime = 0;
var cumulativeTime = 0;
var previousNow = 0;
var refreshMod = 0;
var videoDecodedFrames = 0;
var videoDecodedFramesPerSec = 0;
var videoDroppedFrames = 0;
var videoDecodedFramesPerSec = 0;
var prevVideoDecodedFrames = 0;
var audioBytesDecoded = 0;
var prevAudioBytesDecoded = 0;
var audioBytesDecodedPerSec = 0;
var prevVideoBytesDecoded = 0;
var videoBytesDecodedPerSec = 0;
var decodedMean = new Mean();
var audioMean = new Mean();
var videoMean = new Mean();
var dropMean = new Mean();
var statsString = "";
const times = []; //rrw todo: need to do a correct reset length sometimes (bug)

//just test variables
var mediaSource = "https://rrwinterton.com/bbbat/bbb.webm"
var muted = true;
var canvas = document.getElementById("videoCanvas");
var ctx = canvas.getContext("2d");
var videoContainer;
var video = document.createElement("video");

document.getElementById("inCallBtn").addEventListener("click", inCall);
document.getElementById("statsBtn").addEventListener("click", displayStats);

function inCall() {
    if (inCallFlag == true) {
        inCallFlag = false;
        document.getElementById("meetingStatus").textContent = "Stopped Meeting";
        videoContainer.video.pause();

    }
    else {
        inCallFlag = true;
        document.getElementById("meetingStatus").textContent = "Meeting Started";
        videoContainer.video.play();
        updateCanvas();
    }
}

function displayStats() {
    if (statsFlag == true) {
        statsFlag = false;
    }
    else {
        statsFlag = true;
        updateCanvas();
    }
}

function Mean() {
    this.count = 0;
    this.sum = 0;

    this.record = function (val) {
        this.count++;
        this.sum += val;
    };

    this.mean = function () {
        return this.count ? (this.sum / this.count).toFixed(2) : 0;
    };
}

function initalizeTestVariables() {
    video.src = mediaSource;
    video.autoPlay = false;
    video.loop = true;
    video.muted = muted;
    videoContainer = {
        video: video,
        ready: false,
    };
    video.onerror = function (e) {
        document.body.removeChild(canvas);
        document.body.innerHTML += "<b>video issue</b><br>";
    }
    video.oncanplay = readyToPlayVideo;
}

function playPauseClick() {
    if (videoContainer.ready) {
        if (videoContainer.video.paused) {
            videoContainer.video.play();
        } else {
            videoContainer.video.pause();
        }
    }
}

function drawPlayIcon() {
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#DDD";
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    var size = (canvas.height / 2) * 0.5;
    ctx.moveTo(canvas.width / 2 + size / 2, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 - size / 2, canvas.height / 2 + size);
    ctx.lineTo(canvas.width / 2 - size / 2, canvas.height / 2 - size);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
}

function refreshStats() {
    window.requestAnimationFrame(() => {
        var deltaTime = 0;
        var currentNow = 0;
        const now = performance.now();
        deltaTime = (now - lastCalledTime);
        lastCalledTime = now;
        canvasFPS = 1000 / deltaTime;
        canvasFPS = Math.round(canvasFPS);
        if (canvasFPS > 200) {
            return;
        }
        if (refreshMod == 0) {
            currentNow = performance.now();
            deltaTime = currentNow - previousNow;
            cumulativeTime += currentNow - previousNow;
            previousNow = currentNow;
            videoDroppedFrames = video.webkitDroppedFrameCount;
            videoDecodedFrames = video.webkitDecodedFrameCount;
            videoBytesDecoded = video.webkitVideoDecodedByteCount;
            audioBytesDecoded = video.webkitAudioDecodedByteCount;
            if (deltaTime != 0) {
                videoDecodedFramesPerSec = ((videoDecodedFrames - prevVideoDecodedFrames) * 1000) / deltaTime;
                prevVideoDecodedFrames = videoDecodedFrames;
                videoBytesDecodedPerSec = ((videoBytesDecoded - prevVideoBytesDecoded) * 1000) / deltaTime;
                prevVideoBytesDecoded = videoBytesDecoded;
                audioBytesDecodedPerSec = ((audioBytesDecoded - prevAudioBytesDecoded) * 1000) / deltaTime;
                prevAudioBytesDecoded = audioBytesDecoded;
            }
            if (videoDecodedFramesPerSec != 0) {
                decodedMean.record(videoDecodedFramesPerSec);
            }
            if (audioBytesDecodedPerSec != 0) {
                audioMean.record(audioBytesDecodedPerSec);
            }

            if (statsFlag == true) {
                statsString = Date() + "<hr>";
                statsString += "Time on site (ms): " + Math.round(cumulativeTime * 100) / 100 + "<br>";
                statsString += "Canvas frames/s: " + canvasFPS + "<br>";
                statsString += "Video decoded frames: " + Math.round(videoDecodedFrames * 100) / 100 + "<br>";
                statsString += "Video decoded frames/s: " + Math.round(videoDecodedFramesPerSec * 100) / 100 + "<br>";
                statsString += "Video dropped frames: " + Math.round(videoDroppedFrames * 100) / 100 + "<br>";
                statsString += "Video bytes decoded: " + videoBytesDecoded + "<br>";
                statsString += "Video bytes decoded/s: " + Math.round(videoBytesDecodedPerSec * 100) / 100 + "<br>";
                statsString += "Audio bytes decoded: " + audioBytesDecoded + "<br>";
                statsString += "Audio bytes decoded/s: " + Math.round(audioBytesDecodedPerSec * 100) / 100 + "<br>";
                statsString += "Average video frames/s decoded: " + decodedMean.mean() + "<br>";
                statsString += "Average audio bytes/s decoded: " + audioMean.mean() + "<br>";
            }
            else {
                statsString = Date() + "<hr>";
            }
        }
        refreshMod = ++refreshMod % 30; //not sure why has to be <= 30
    });

}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (videoContainer.ready) {
        video.muted = muted;
        var scale = videoContainer.scale;
        var vidH = videoContainer.video.videoHeight;
        var vidW = videoContainer.video.videoWidth;
        var top = canvas.height / 2 - (vidH / 2) * scale;
        var left = canvas.width / 2 - (vidW / 2) * scale;
        ctx.drawImage(videoContainer.video, left, top, vidW * scale, vidH * scale);
        if (videoContainer.video.paused) {
            drawPlayIcon();
        }
    }
    if (inCallFlag == true) {
    requestAnimationFrame(updateCanvas);
    refreshStats();
    }
    var d = document.getElementById("log");
    d.innerHTML = statsString;
}

function readyToPlayVideo(event) {
    videoContainer.scale = Math.min(
        canvas.width / this.videoWidth,
        canvas.height / this.videoHeight);
    videoContainer.ready = true;
    updateCanvas();

    canvas.addEventListener("click", playPauseClick);
    document.getElementById("meetingStatus").textContent = "Start Meeting";
}

function createCanvasOverlay(color, canvasContainer) {
    if (!videoCanvas) {
        if (!canvasContainer) {
            canvasContainer = document.createElement('div');
            document.body.appendChild(canvasContainer);
            canvasContainer.style.position = "absolute";
            canvasContainer.style.left = "0px";
            canvasContainer.style.top = "0px";
            canvasContainer.style.width = "100%";
            canvasContainer.style.height = "100%";
            canvasContainer.style.zIndex = "100";
            superContainer = document.body;
        }
        else {
            superContainer = canvasContainer;
        }
        videoCanvas = document.createElement('canvas');
        videoCanvas.style.width = superContainer.scrollWidth + "px";
        videoCanvas.style.height = superContainer.scrollHeight + "px";
        videoCanvas.width = superContainer.scrollWidth;
        videoCanvas.height = superContainer.scrollHeight;
        videoCanvas.style.overflow = 'visible';
        videoCanvas.style.position = 'absolute';
        var context = videoCanvas.getContext('2d');
        context.fillStyle = color;
        context.fillRect(0, 0, videoCanvas.width, videoCanvas.height);
        canvasContainer.appendChild(videoCanvas);
    }
}
initalizeTestVariables();
