//process.env.PORT = 4002;
const { Worker } = require("worker_threads");
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const express = require('express');
const axios = require('axios').default;
var Jimp = require('jimp');
var path = require('path');
const app = express();
var globalTotalProcessed = 0n;
var workerWithMaxUsage = 0;
var dateInit = new Date();
console.log(path.join(__dirname, '/../app'));
//app.use(express.static(process.env.PWD+'/storage'))
app.use(express.static(path.join(__dirname, '/../app'), { maxAge: 86400000 }));
app.get('/', (req, res) => {
  res.json({
      total: globalTotalProcessed.toString(),
      maxUsage: (Math.round(workerWithMaxUsage / 1024 / 1024 * 100) / 100),
      timeActive: (((new Date()) - dateInit) / 1000),
  });
});
app.get('/init',(req, res) => {
    var url = req.protocol + '://' + req.hostname;
    dateInit = new Date();
    var worker = new Worker("./worker.js");
    worker.on("exit", () => {
        global.gc();
        console.log('worker - end');
        /*
        axios.get(url+'/init?i=1&e=100000')
            .then(function (response) {
                console.log(response.data);
            })
            .catch(function (error) {
                console.log('error');
            });
        */
    });
    worker.on("message", (value) => {
        globalTotalProcessed = globalTotalProcessed + BigInt(value.totalProcessed);
        if(value.rss>workerWithMaxUsage){
            workerWithMaxUsage = value.rss;
            storage(value.list,value.init,value.end);
        } 
    });
    worker.on("error", (value) => {
        console.log('worker-error', value);
    });
    worker.postMessage(
        {   
            "init":req.query.i,
            "end":req.query.e,
        }
    );
    res.json({"status":true});
})
app.listen(process.env.PORT, () => {
  console.log('listen:'+(process.env.PORT));
});

// storage 
async function storage(list,init,end){
    console.log(list.length);
    console.log(list[0]);
    console.log(list[65535]);
    let w = 1024;
    let h = 512;
    let jimg = new Jimp(w, h);
    var i = 0;
    for (var x=0; x<w; x=x+8) {
        for (var y=0; y<h; y++) {
            var hex = list[i];
            var j = 0;
            for(var p = 0; p < 64; p=p+8){
                var pixel = hex.substring(p,p+8);
                var num = parseInt(pixel, 16);
                jimg.setPixelColor(num, x+j, y);
                j++;
            }
            i++;
        }
    }
    var fileName = path.join(__dirname, '/../app')+init+'.'+end+'.png';
    try{
        jimg.write(fileName, function(){
            console.log('created');
            Jimp.read(fileName, function (err, image) {
                if (err) throw err;
                console.log(image.getPixelColor(0, 0).toString(16));
                console.log(image.getPixelColor(1023, 511).toString(16));
            });
        });
    }catch(e){
        console.log(e);
    }
    var difference = ((new Date()) - dateInit)/1000;
    console.log(difference);
}