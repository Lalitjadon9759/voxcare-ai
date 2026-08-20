require("dotenv").config();

const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`
========================================
🚀 VoxCare AI Server
🌐 http://localhost:${PORT}
========================================
`);
});