const net = require('net');
const server = net.createServer();
try {
  server.listen('/tmp/test.sock', 'localhost', () => { // passing string, then hostname
    console.log("Success");
  });
} catch(e) {
  console.error("FAIL:", e);
}
