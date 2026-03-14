const https = require("https");

const host = "wisecash.app";
const key = "4b3c6fd1c7894cf4995650f0245c1b57";
const keyLocation = `https://${host}/${key}.txt`;
const urlList = [
  `https://${host}/`,
];

const payload = JSON.stringify({
  host,
  key,
  keyLocation,
  urlList,
});

const request = https.request(
  "https://api.indexnow.org/indexnow",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(payload),
    },
  },
  (response) => {
    let body = "";
    response.on("data", (chunk) => {
      body += chunk;
    });
    response.on("end", () => {
      if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        console.log(JSON.stringify({ ok: true, status: response.statusCode, submitted: urlList }, null, 2));
        return;
      }

      console.error(JSON.stringify({ ok: false, status: response.statusCode, body }, null, 2));
      process.exit(1);
    });
  },
);

request.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

request.write(payload);
request.end();
