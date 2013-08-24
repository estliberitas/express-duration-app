Video duration calculator application
===

This Express application allows you to calculate total duration for given video
files without uploading them (almost). Instead of full uploading it reads chunks
from client (i.e. browser) using HTML5 File API & WebSockets and passes that
data to `ffprobe` command-line utility.

# Requirements
* Node.js (>=0.10.x)
* `ffprobe` tool (>=1.x). Usually comes with `ffmpeg` package

# Installation & running

1. `$ git clone git://github.com:estliberitas/express-duration-app.git`
2. `$ cd express-duration-app`
3. `$ npm install`
4. `$ PORT=1337 node app.js`
5. Open `http://127.0.0.1:3000/` in browser (which hopefully supports websockets)

# How it works
* When page is opened, WebSocket connection is established using `socket.io`.
* Once one presses `Browse` button and selects one or more video files, client
sends `get duration` request via websockets with list of files.
* For each file backend generates URL
`http://127.0.0.1:PORT/data/{SOCKET_ID}/{FILENAME}` and spawns
`ffprobe [options] URL`.
* When `ffprobe` makes HTTP request to URL, backend handler requests file data
from client via websockets using range specified by `ffprobe` in HTTP request
`Range` header.