import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      console.warn('Could not connect to external MongoDB. Falling back to embedded MongoMemoryServer for standalone development...', err.message);
    }
  }

  // Fallback to in-memory MongoDB
  console.log('Starting in-memory MongoDB instance...');
  mongoMemoryServer = await MongoMemoryServer.create();
  const memoryUri = mongoMemoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log(`In-Memory MongoDB connected at ${memoryUri}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
