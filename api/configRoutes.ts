import { connectDB, SiteConfig } from "./_shared.js";

const clean = (value:any) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const out:any = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "_id" || key === "__v" || key === "createdAt" || key === "updatedAt" || key === "key") continue;
    out[key] = item;
  }
  return out;
};

export async function handleConfigRoutes(req:any, res:any):Promise<boolean> {
  const url = String(req.url || "").split("?")[0];
  if (url !== "/api/admin/config" || req.method !== "POST") return false;

  try {
    await connectDB();
    const payload = clean(req.body || {});
    const config = await (SiteConfig as any).findOneAndUpdate(
      { key: "global" },
      { $set: payload, $setOnInsert: { key: "global" } },
      { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({ success: true, config });
  } catch (error:any) {
    console.error("[admin-config]", error?.message || error);
    return res.status(500).json({ success: false, error: "Configuration could not be saved" });
  }
}
