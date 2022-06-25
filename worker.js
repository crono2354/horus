const {parentPort} = require("worker_threads");
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var processData = require('process');
var totalProcessed = 1n;
parentPort.on("message", (value) => {
	var init = BigInt(value.init);
	var end = BigInt(value.end);
	console.log('init = ['+init+','+end+']');
	initProcess(init,end);
});
async function initProcess(init,end){
	var rss = processData.memoryUsage().rss;
	var resultList = [];
	var dateInit = new Date();
	var response;
	if(init==0n){
		resultList.push('0000000000000000000000000000000000000000000000000000000000000000');
		init = init + 1n;
	}
	for (var i = init; i < end; i++) {
		var k = ec.keyFromPrivate(i.toString(16));
		var x = k.getPublic().getX();
		var hex = '0000000000000000000000000000000000000000000000000000000000000000'+x.toString(16);
    	hex = hex.substring(hex.length-64,hex.length);
		resultList.push(hex);
		totalProcessed++;
		var rssInner = processData.memoryUsage().rss;
        if(rssInner>rss) rss = rssInner;
	}
	var dateEnd = new Date();	
	var difference = (dateEnd - dateInit) / 1000;
	response = {
		list: resultList,
		time: difference,
		totalProcessed: totalProcessed.toString(),
		init: init.toString(),
		end: end.toString(),
		rss: rss,
	}
	parentPort.postMessage(response);
	resultList.splice(0,resultList.length);
	parentPort.close();
}