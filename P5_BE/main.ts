import { ApolloServer } from "@apollo/server";
import { schema } from "./schema.ts";
import { MongoClient } from "mongodb";
import { User_M, Post_M, Comment_M } from "./types.ts";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "./resolvers.ts";

const MONGO_URL = "mongodb+srv://prodriguezc:123456A@cluster0.pwbwl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  //Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
  throw new Error("Please provide a MONGO_URL");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();

console.info("Connected to MongoDB");

const mongoDB = mongoClient.db("users");
const UserCollection = mongoDB.collection<User_M>("users");
const PostCollection = mongoDB.collection<Post_M>("posts");
const CommentCollection = mongoDB.collection<Comment_M>("comment");

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async () => ({ UserCollection, PostCollection, CommentCollection }),
  listen: { port: 4000 },
});

console.info(`Server ready at ${url}`);
