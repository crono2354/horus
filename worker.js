const {parentPort} = require("worker_threads");
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var processData = require('process');
var totalProcessed = 1n;
parentPort.on("message", (value) => {
	var init = BigInt(value.init);
	var end = BigInt(value.end);
	initProcess(init,end);
});
function initProcess(init,end){
	var rss = processData.memoryUsage().rss;
	var resultList = [];
	var dateInit = new Date();
	var response;
	for (var i = init; i <= end; i++) {
		var k = ec.keyFromPrivate(i.toString(16));
		var x = k.getPublic().getX();
		resultList.push([i.toString(), x.toString(),]);
		totalProcessed++;
		var rssInner = processData.memoryUsage().rss;
        if(rssInner>rss) rss = rssInner;
	}
	var dateEnd = new Date();	
	var difference = (dateEnd - dateInit) / 1000;
	response = {
		total: true,
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