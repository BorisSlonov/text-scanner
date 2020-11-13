"use scrict"

var canvas = document.createElement("canvas")
var video = document.getElementById('video')
var div = document.querySelector('#text')
var videoWrap = document.querySelector('.video-full-screen')
var loading = false
var snapping = false
var localStream


// подключаемся к камере и запускаем стрим
var start = () => {
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: { ideal: 1024 },
            height: { ideal: 768 },
            facingMode: "user"
            // facingMode: { exact: "environment" }
        }
    }).then(stream => {
        localStream = stream;
        snapping = true;
        video.srcObject = stream;
        videoWrap.style.visibility = "visible";
    }).catch(log);
}


//создаем канвас, срисовываем центральную часть с видео и отправляем на сервер
var snap = () => {
    if (snapping) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        preview.getContext('2d').drawImage(canvas, 0, video.videoHeight / 5, video.videoWidth, video.videoHeight - video.videoHeight / 2, 0, video.videoHeight / 4, video.videoWidth, video.videoHeight - video.videoHeight / 2);

        let data = preview.toDataURL().split(',')[1];

        const dataToSend = JSON.stringify({ "image": data });
        let dataReceived = "";
        if (!loading) {
            loading = true;

            fetch("https://mrz-proxy.herokuapp.com/process", {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: dataToSend,
                rejectUnauthorized: false,
                requestCert: true,
                agent: false
            }).then(resp => {
                if (resp.status === 200) {
                    return resp.json()
                } else {
                    console.log("Status: " + resp.status)
                    return Promise.reject("server")
                }
            }).then(dataJson => {
                if (!dataJson['error']) {
                    //if (dataJson['valid_score'] > 5) 
                    //document.getElementById("text").innerHTML = JSON.stringify(dataJson);
                    snapping = false;
                    videoWrap.style.visibility = "hidden";
                    document.getElementById("number").value = dataJson['number'];
                    document.getElementById("series").value = dataJson['personal_number'];
                    localStream.getTracks().forEach((track) => {
                        track.stop();
                    });
                }
                loading = false;
            })
                .catch(err => {
                    loading = false;
                    if (err === "server") return
                    console.log(err)
                })
        }
    }
}

setInterval(snap, 500000);

var log = msg => div.innerHTML += "<br>" + msg;