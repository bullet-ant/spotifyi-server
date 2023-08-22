const express = require("express");
const readline = require("readline");
const fs = require("fs");
const grabber = require("../lib/index");
const { config } = require("dotenv");
const axios = require("axios");
const router = express.Router();
config();

const handleDownload = (stream, output) => {
  let starttime;

  stream.pipe(fs.createWriteStream(output));

  stream.once("response", () => {
    starttime = Date.now();
  });

  stream.on("progress", (chunkLength, downloaded, total) => {
    const percent = downloaded / total;
    const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
    const estimatedDownloadTime =
      downloadedMinutes / percent - downloadedMinutes;
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
    process.stdout.write(
      `(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(
        total /
        1024 /
        1024
      ).toFixed(2)}MB)\n`
    );
    process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
    process.stdout.write(
      `, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `
    );
    readline.moveCursor(process.stdout, 0, -1);
  });
};

const getVideoId = async (name, artists) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${
      process.env.API_KEY
    }&q=${name.replace(/ /g, "+")}+by+${artists[0].replace(
      / /g,
      "+"
    )}&type=video`;

    console.log(`searching YouTube for song - ${name} by ${artists[0]}`);
    const searchResults = await axios.get(url);

    const videoId = searchResults.data.items[0]["id"]["videoId"];
    console.log(
      `downloading song that matches best - https://www.youtube.com/watch?v=${videoId}`
    );

    return videoId;
  } catch (error) {
    console.error(`error: `, error.message);
  }
};

router.route("/youtube/download/").post(async (req, res) => {
  const { name, artists } = req.body;
  const output = `/tmp/${name} (${artists[0]}).m4a`;

  console.log(
    `verifying if ${name} by ${artists.join(", ")} is already downloaded...`
  );
  if (fs.existsSync(output)) {
    console.log("song already present!");
    res.download(output, `${name}.m4a`, (err) => {
      if (err) res.status(500).send({ error: err.message });
    });
    return;
  }

  const id = await getVideoId(name, artists);

  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const stream = grabber(url, {
      quality: "highestaudio",
    });

    handleDownload(stream, output);

    stream.on("end", () => {
      process.stdout.write("\n\n");
      res.download(output, `${name}.m4a`, (err) => {
        if (err) res.status(500).send({ error: err.message });
      });
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
