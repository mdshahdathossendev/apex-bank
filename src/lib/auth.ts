import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing");
}

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters");
}

export const mongoClient = new MongoClient(mongoUri);
export const bankingDb = mongoClient.db("bankingUsers");

export const auth = betterAuth({
  secret: authSecret,
  emailAndPassword: {
    enabled: true, 
  },
  database: mongodbAdapter(bankingDb, {
    client: mongoClient,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        input: false,
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL,
});