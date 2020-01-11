const express = require("express");
const ytdl = require("ytdl-core");
const moment = require("moment");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.render("home");
});

//TODO: Delete Later
router.get("/convert", (req, res) => res.redirect("/"));

router.post("/convert", (req, res) => {
  const link = req.body.youtubeURL;
  const videoID = getID(link);
  const start = Date.now();

  if (!link.match("&")) {
    getTitle(videoID)
      .then(info => {
        if (info.player_response.isLiveContent) {
          req.flash(
            "invalidURL",
            "Can't download this video, Unsupported video (Live Video)"
          );
          res.redirect("/");
        } else {
          res.render("convert", {
            info,
            videoid: videoID,
            date: moment(info.published).format("MMM DD, YYYY")
          });
        }
        ffmpeg(
          ytdl(videoID, {
            quality: "highestaudio"
          })
        )
          .setFfmpegPath("./ffmpeg/ffmpeg.exe")
          .audioBitrate(128)
          .save(`./mp3/${videoID}.mp3`)
          .on("progress", p => {
            req.app
              .get("io")
              .to(req.app.get("sockedID"))
              .emit("progress", `${p.targetSize} kb Downloaded To Server.`);
          })
          .on("end", () => {
            req.app
              .get("io")
              .to(req.app.get("sockedID"))
              .emit(
                "done",
                `\nDownloaded & Converted - ${Math.ceil(
                  (Date.now() - start) / 1000
                )} sec.`
              );
          })
          .on("error", function(err, stdout, stderr) {
            console.log("Cannot process video: " + err.message);
          });
      })
      .catch(err => {
        req.flash(
          "invalidURL",
          "Invalid URL! (ex: https://www.youtube.com/watch?v=kJQP7kiw5Fk)"
        );
        res.redirect("/");
      });
  } else {
    req.flash(
      "invalidURL",
      "Invalid URL! (ex: https://www.youtube.com/watch?v=kJQP7kiw5Fk)"
    );
    res.redirect("/");
  }
});

router.post("/download", (req, res) => {
  res.download(`./mp3/${req.body.videoID}`, `${req.body.songName}.mp3`, err => {
    //TODO: Fix later
    // !err
    //   ? fs.unlink(`./mp3/${req.body.videoID}`, (err, result) => {
    //       if (err) {
    //         if (res.headersSent) {
    //           console.log("N");
    //         } else {
    //           console.log("S");
    //         }
    //       }
    //     })
    //   : console.log(err);
    if (err) console.log(err);
  });
});

router.get("*", (req, res) => {
  res.redirect("/");
});

//Get Video Infos
const getTitle = videoID => {
  return new Promise((resolve, reject) => {
    ytdl.getInfo(videoID, (err, info) => {
      !err ? resolve(info) : reject(err);
    });
  });
};

//Get Video ID
let getID = url => {
  if (url) {
    url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    let x = url[2] !== undefined ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
    return x;
  }
};

module.exports = router;
