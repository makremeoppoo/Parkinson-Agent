require('dotenv').config();

// On Cloud Run there is no key file on disk — decode it from the env var.
if (process.env.FIREBASE_CREDENTIALS_BASE64 && !require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || '')) {
  const fs   = require('fs');
  const creds = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
  fs.writeFileSync('/tmp/gcs-key.json', creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/gcs-key.json';
}

const cors = require("cors");
const express = require("express");
const app = express();

global.__basedir = __dirname;

var corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3031',
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
};


app.use(cors(corsOptions));

const initRoutes = require("./src/routes");

app.use(express.json({ limit: '50mb' })); // video/webm base64 peut dépasser 10mb
app.use(express.urlencoded({ extended: true }));
initRoutes(app);

let port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Running at 0.0.0.0:${port}`);
});
