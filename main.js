//process.env.PORT = 4002;
const { Worker } = require("worker_threads");
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const express = require('express');
const axios = require('axios').default;
var Jimp = require('jimp');
var path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive']
const KEY_FILE = 'braided-turbine-354608-80e0638b7621.json';
const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES
});
const app = express();
var globalTotalProcessed = 0n;
var workerWithMaxUsage = 0;
var dateInit = new Date();
var totalToProcess = 0;
app.use('/storage',express.static(path.join(__dirname, '/../app'), { maxAge: 86400000 }));
app.get('/', (req, res) => {
  res.json({
      total: globalTotalProcessed.toString(),
      maxUsage: (Math.round(workerWithMaxUsage / 1024 / 1024 * 100) / 100),
      timeActive: (((new Date()) - dateInit) / 1000),
  });
});
app.get('/init',(req, res) => {
    var url = req.protocol + '://' + req.hostname;
    //var url = 'http://localhost:4002';
    dateInit = new Date();
    var worker = new Worker("./worker.js");
    worker.on("exit", () => {
        console.log('worker->end',totalToProcess);
        var init = BigInt(req.query.e) + 1n
        var end = init + 65536n;
        if(totalToProcess>0){
            console.log('next -> '+url+'/init?i='+init.toString()+'&e='+end.toString());
            axios.get(url+'/init?i='+init.toString()+'&e='+end.toString())
                .then(function (response) {
                    console.log(response.data);
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
        console.log('resta',totalToProcess);
        totalToProcess--;
        global.gc();
    });
    worker.on("message", (value) => {
        globalTotalProcessed = globalTotalProcessed + BigInt(value.list.length);
        if(value.rss>workerWithMaxUsage){
            workerWithMaxUsage = value.rss;
        } 
        console.log('storage');
        storage(value.list,value.init,value.end,worker);
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
async function storage(list,init,end,worker){
    console.log(list.length);
    console.log(list[0][7]);
    console.log(list[65535][7]);
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
    init = BigInt(init);
    end = BigInt(end);
    var fileName = path.join(__dirname, '/../app')+'/'+init.toString(16)+'_'+end.toString(16)+'.png';
    console.log(fileName);
    try{
        await jimg.writeAsync(fileName); 
        console.log('created');
        const driveService = google.drive({version:'v3',auth});
        let fileMetaData = {
            name: init.toString(16)+'_'+end.toString(16)+'.png',
            parents: ['1ZxyVU3o5hHOPY9bQXXN8rbjPmJgYQk89']
        };
        let media = {
            mimeType: 'image/png',
            body: fs.createReadStream(fileName)
        }
        let response = await driveService.files.create({
            resource: fileMetaData,
            media: media,
            fields: 'id'
        });
        switch(response.status){
            case 200:
                console.log('ok',response.data.id);
                break;
            default:
                console.log('error',response.errors);
                break;
        }
        worker.terminate();
    }catch(e){
        console.log(e);
    }
    var difference = ((new Date()) - dateInit)/1000;
    console.log(difference);
}