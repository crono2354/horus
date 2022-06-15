/*
const express = require("express");
const app = express();
const cors = require('cors');
const { Worker } = require("worker_threads");
const bodyParser = require('body-parser');
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
var server = require("http").Server(app);
var io = require("socket.io")(server, {
    cors: {
        origin: ["*"],
        methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
        handlePreflightRequest: (req, res) => {
            const headers = {
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Origin": req.headers.origin,
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Methods": "PUT,GET,POST,DELETE,OPTIONS"
            };
            res.writeHead(200, headers);
            res.end();
        }
    },
    transports: [ 'websocket', 'polling' ],
});
server.listen((process.env.PORT || 3000), function () {
    console.log('listen:'+(process.env.PORT || 3000)+' - ['+__dirname+']');
});
var processList = [];
io.on("connection", function (socket) {
    socket.on("data", function (res) {
        processList = [];
        global.gc();
        var workersList = [];
        for(var i = 0; i < res.ranges.length; i++){
            workersList.push([i,new Worker("./mainWorker.js"),res.ranges[i]]);
        }
        processList.push({processId: res.processId, socketId: res.socketId, workers: workersList});
        console.log('Init processId ['+res.processId+'] - socketId ['+res.socketId+'] - Workers [' + res.ranges.length+ ']');
        var processId = res.processId;
        var processIdIndex = processList.findIndex(x => x.processId == processId);
        var workersActive = processList[processIdIndex].workers.length;
        var socketId = processList[processIdIndex].socketId;
        if(processList[processIdIndex]){
            for(var i = 0; i < processList[processIdIndex].workers.length; i++){
                processList[processIdIndex].workers[i][1].on("exit", () => {
                    workersActive--;
                    if(workersActive==0){
                        console.log('End processId ['+processId+'] - socketId ['+socketId+']');
                        socket.emit('end',{"processId":processId, "socketId": socketId});
                    } 
                });
                processList[processIdIndex].workers[i][1].on("message", (value) => {
                    if(value.total){
                        socket.emit('data',
                            {
                                "processId": value.processId,
                                "workerId": value.workerId,
                                "list": value.list,
                                "time": value.time, 
                                "totalProcessed": value.totalProcessed,
                                "init": value.init,
                                "end": value.end
                            });
                        processIdIndex = processList.findIndex(x => x.processId == value.processId);
                        processList.splice(processIdIndex,1);
                    }
                });
                processList[processIdIndex].workers[i][1].on("error", (value) => {
                    console.log('error', value);
                });
                processList[processIdIndex].workers[i][1].postMessage(
                    {   
                        "processId":processId,
                        "init":res.init,
                        "end":res.end,
                        "sector":res.sector,
                        "workerId":processList[processIdIndex].workers[i][0],
                        "workerRangeInit":processList[processIdIndex].workers[i][2][0],
                        "workerRangeEnd":processList[processIdIndex].workers[i][2][1]
                    }
                );
            }
        } 
    });
});*/
const io = require('socket.io')();
console.log(process.env.PORT);
io.on('connection', client => {
    console.log('connected');
 });
io.listen(3000);