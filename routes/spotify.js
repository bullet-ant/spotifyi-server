const { config } = require("dotenv");
const express = require("express");
const axios = require("axios");
const router = express.Router();

config();

const fetchToken = async () => {
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        btoa(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET),
    },
    form: {
      grant_type: "client_credentials",
    },
    json: true,
  };
  try {
    console.log(`refreshing access token...`);
    const response = await axios.post(authOptions.url, null, {
      headers: authOptions.headers,
      params: authOptions.form,
    });
    console.log(`response: `, response);
    if (response.status === 200) {
      const token = response.data.access_token;
      console.log(`token: ${token}`);
      process.env.TOKEN = token;
      return token;
    } else {
      console.error("error: ", response.data);
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const fetchSpotifyApi = async (endpoint, method, body) => {
  const token = await fetchToken();
  try {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method,
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (error) {
    console.error(`error: ${error.message}`);
  }
};

const extractTracks = (list) => {
  const metadata = [];
  list.forEach((track) => {
    const { name, album, artists } = track;
    metadata.push({
      name,
      album: album.name,
      artists: artists.map((artist) => artist.name),
      release_date: album.release_date,
      thumbnails: album.images.map((image) => image.url),
    });
  });
  logTrackInfo(metadata);

  return metadata;
};

const logTrackInfo = (metadatas) => {
  const formatMetadata = (metadata) => {
    return `${metadata.name} by ${metadata.artists.join(", ")} (${
      metadata.release_date.split("-")[0]
    })`;
  };

  if (metadatas.length > 3) {
    metadatas
      .slice(0, 3)
      .forEach((metadata) => console.log(formatMetadata(metadata)));
    console.log(`... ${metadatas.length - 3} more tracks`);
  } else {
    metadatas.forEach((metadata) => console.log(formatMetadata(metadata)));
  }
  console.log()
};

router.route("/spotify/track/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`fetching metadata for track - ${id}`);

    const track = await fetchSpotifyApi(`v1/tracks/${id}`, "GET");
    const tracks = extractTracks([track]);

    res.json(tracks);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.route("/spotify/tracks/:ids").get(async (req, res) => {
  try {
    const ids = req.params.ids;
    console.log(`fetching metadata for track - ${ids}`);

    const track = await fetchSpotifyApi(`v1/tracks?ids=${ids}`, "GET");
    const tracks = extractTracks(track.tracks);

    res.json(tracks);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.route("/spotify/playlist/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`fetching metadata for playlist - ${id}`);

    const playlist = await fetchSpotifyApi(`v1/playlists/${id}`, "GET");
    const tracks = extractTracks(
      playlist.tracks.items.map((item) => item.track)
    );

    res.json(tracks);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.route("/spotify/album/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`fetching metadata for album - ${id}`);

    const album = await fetchSpotifyApi(`v1/albums/${id}`, "GET");
    const tracks = extractTracks(album);

    res.json(tracks);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
