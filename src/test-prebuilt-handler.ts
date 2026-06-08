// Minimal pre-built test — does NOT import anything from server/

export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    source: "prebuilt",
    url: req.url,
    node: process.version,
    deployed: true,
  });
}
