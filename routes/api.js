module.exports = (app, yeelight) => {
  app.post("/api/bright", (req, res) => {
    const { action } = req.body;
    const bright = action === "up" ? 95 : 5;

    yeelight.setBright(bright, "smooth", 1000);
    res.status(204).send();
  });

  app.post("/api/toggle", (_req, res) => {
    yeelight.toggle();
    res.status(204).send();
  });
};
