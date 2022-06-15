const {parentPort} = require("worker_threads");
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var totalProcessed = 1n;
parentPort.on("message", (value) => {
	var initLoop = BigInt(value.workerRangeInit);
	var endLoop = BigInt(value.workerRangeEnd);
	initProcess(initLoop,endLoop,value.workerId,value.processId);
});
function initProcess(init,end,workerId,processId){
	var resultList = [];
	var dateInit = new Date();
	var response;
	for (var i = init; i <= end; i++) {
		var k = ec.keyFromPrivate(i.toString(16));
		var x = k.getPublic().getX();
		resultList.push([i.toString(), x.toString(),]);
		totalProcessed++;
	}
	var dateEnd = new Date();	
	var difference = (dateEnd - dateInit) / 1000;
	response = {
		total: true,
		list: resultList,
		time: difference,
		workerId: workerId,
		processId: processId,
		totalProcessed: totalProcessed.toString(),
		init: init.toString(),
		end: end.toString()
	}
	parentPort.postMessage(response);
	resultList.splice(0,resultList.length);
	parentPort.close();
}