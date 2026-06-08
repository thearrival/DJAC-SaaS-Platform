// src/test-prebuilt-handler.ts
async function handler(req, res) {
  res.status(200).json({
    ok: true,
    source: "prebuilt",
    url: req.url,
    node: process.version,
    deployed: true
  });
}
export {
  handler as default
};
