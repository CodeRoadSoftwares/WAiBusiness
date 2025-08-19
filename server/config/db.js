import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.DATABASE_URL;

  try {
    const connection = await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || undefined,
    });

    const { host, port, name: dbName } = connection.connection;
    console.log(`[db] connected: mongodb://${host}:${port}/${dbName}`);
    return connection.connection;
  } catch (error) {
    console.error("[db] connection error:", error);
    throw error;
  }
}

export default connectDB;
