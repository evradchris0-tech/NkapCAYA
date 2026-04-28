const http = require('http');
const server = http.createServer();
try {
  server.listen('/tmp/test.sock', 'localhost', () => {
    console.log("Started");
    process.exit(0);
  });
} catch(e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
