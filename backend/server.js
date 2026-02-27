require('dotenv').config();

const cors = require("cors");
const express = require("express");
const app = express();

global.__basedir = __dirname;

var corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3031',
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
};


app.use(cors(corsOptions));

const initRoutes = require("./src/routes");

app.use(express.json({ limit: '50mb' })); // video/webm base64 peut dépasser 10mb
app.use(express.urlencoded({ extended: true }));
initRoutes(app);

let port = process.env.PORT || 1000;
app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});
