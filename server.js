const express = require("express");
const { config } = require("dotenv");
const cors = require("cors");

config();
const port = process.env.PORT || 5500;
const app = express();
const home = require("./routes/home");
const spotify = require("./routes/spotify");
const youtube = require("./routes/youtube");

app.use(cors());
app.use(express.json())

app.use(home);
app.use(spotify);
app.use(youtube);

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}\n`);
});
