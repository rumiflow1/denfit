import mongoose from "mongoose";

let cached: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  // Reuse an already-started connection instead of opening a second pool.
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose;
  }

  if (!cached) {
    cached = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
    }).catch((error) => {
      cached = null;
      throw error;
    });
  }

  await cached;
  return mongoose;
}

export const looseSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

export function collectionModel(name: string, collection: string) {
  return (mongoose.models[name] as mongoose.Model<any>) || mongoose.model(name, looseSchema, collection);
}

export const SiteConfig = collectionModel("ProductionSiteConfig", "siteconfigs");
export const Product = collectionModel("ProductionProduct", "products");
export const Order = collectionModel("ProductionOrder", "orders");
export const Media = collectionModel("ProductionMedia", "media");
