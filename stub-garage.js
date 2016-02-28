var express = require('/usr/local/lib/node_modules/express');
var io = require('socket.io');
app = express(),
  server = require('http').createServer(app),
  io = io.listen(server);

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get('/run', function(req, res) {
    var exec = require('child_process').exec;
    console.log("Running motor");
    function result(error, stdout, stderr) {
       res.send(stdout);
    }

    exec('/home/pi/ftdi/lm60', result);
    //exec('pwd', result);
});

app.get('/status', function(req, res) {
    var exec = require('child_process').exec;
    console.log("Checking doorstatus");
    function result(error, stdout, stderr) {
       res.send(stdout);
    }
//    exec('/home/pi/port/doorstatus2', result);
    exec('/home/pi/port/stub', result);
});

app.get('/garagepi', function(req, res) {
    res.send('redirect');
});

server.listen(4000);
var activeClients = 0;
var interv = 0;
var exec = require('child_process').exec;
var lastdoor = '{"garage":"-","inner":"-"}';
io.sockets.on('connection', function(socket){clientConnect(socket)});
io.set('log level', 1);
var ts = (new Date()).toLocaleString() + "  ";

console.log (ts + 'Running on port 4000 ');

function checkGarageStatus(socket) {
    function result(error, stdout, stderr) {
	// Check for change and notify clients
        if(stdout != lastdoor) {
		console.log(ts + stdout);
                 var test = {
                        status:{JSON.parse(stdout) }
                socket.broadcast.emit('status1', {status:stdout});
                socket.broadcast.emit('status2', test);
                socket.emit('status1',{status:stdout});
                socket.emit('status1',test);
	} 
	lastdoor = stdout;
    }
    exec('/home/pi/port/stub', result);
}


function clientConnect(socket){
  activeClients +=1;
  console.log(ts + "connected, clients:" + activeClients);
  socket.emit('status', {status:lastdoor});
  if(interv == 0) {
    console.log(ts + "Starting to check doors");
    interv = setInterval(checkGarageStatus, 200, socket);
  }
  socket.on('disconnect', function(){clientDisconnect()});
  socket.on('run', function() { 
    			function result(error, stdout, stderr) {
				// console.log(stdout);
    			}	
    			console.log(ts + "Running motor"); 
    			exec('/home/pi/ftdi/lm60', result);
		});
  socket.on('status', function() { 
			console.log(ts + "Statuscheck:" + lastdoor);
  			socket.broadcast.emit('status', {status:lastdoor});
		});
}
 
function clientDisconnect(){
  activeClients -= 1;
  console.log(ts + "disconnect, clients:" + activeClients);
  if(activeClients == 0) {
	console.log(ts + "Stopping door status check")
	clearInterval(interv);
	interv = 0;
  }
}

