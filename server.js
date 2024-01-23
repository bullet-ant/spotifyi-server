const express = require("express");
const { config } = require("dotenv");
const cors = require("cors");

config();

const app = express();
const home = require("./routes/home");
const spotify = require("./routes/spotify");
const youtube = require("./routes/youtube");

app.use(cors());
app.use(express.json())

app.use('/api', home);
app.use('/api', spotify);
app.use('/api', youtube);

module.exports = app;

