const express = require("express");
const y = require("yeelight-awesome");
const bodyParser = require("body-parser");
const apiRoutes = require("./routes/api");

const PORT = 3000;
const app = express();

app.use(bodyParser.json());
app.use(express.static("frontend"));

const discover = new y.Discover({
  port: 1982,
  debug: true,
});

discover.once("deviceAdded", (device) => {
  const yeelight = new y.Yeelight({
    lightIp: device.host,
    lightPort: device.port,
  });

  yeelight.on("connected", () => {
    apiRoutes(app, yeelight);
    app.listen(PORT, () => console.log('Listen! :)'));
  });
  yeelight.connect();
});

discover.start();
