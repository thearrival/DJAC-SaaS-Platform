import { COOKIE_NAME } from "../shared/const";

export default async function handler(req: any, res: any) {
  res.status(200).json({ ok: true, cookieName: COOKIE_NAME });
}
