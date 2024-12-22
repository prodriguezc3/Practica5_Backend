/*1. Comprobar comillas
2. punto y coma al final

*/

export const schema = `#graphql

#types
type User{
    id:ID!
    name:String!
    password:String!
    email:String!
    posts:[Post!]!
    comments : [Comment!]!
    likedPosts: [Post!]!
}

type Post {
    id: ID!
    content: String!
    author: User!
    comments: [Comment!]!
    likes: [User!]!
}

type Comment {
    id:ID!
    text:String!
    author:User!
    post:Post!
}

# Queries
type Query {
  users: [User!]!
  user(id: ID!): User
  
  posts: [Post!]!
  post(id: ID!): Post
  
  comments: [Comment!]!
  comment(id: ID!): Comment
}
 
# Mutations
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
 
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!
  
  addLikeToPost(postId: ID!, userId: ID!): Post!
  removeLikeFromPost(postId: ID!, userId: ID!): Post!
  
  createComment(input: CreateCommentInput!): Comment!
  updateComment(id: ID!, input: UpdateCommentInput!): Comment!
  deleteComment(id: ID!): Boolean!
}

//TIPO INPUT
input CreateUserInput {
    name:String!
    password:String!
    email:String!
};
input UpdateUserInput {
    name:String
    password:String
    email:String
};


input CreatePostInput {
  content: String!
  author: ID!
};
input UpdatePostInput {
  content: String
};


input CreateCommentInput {
    text:String!
    author: ID!
    post: ID! 
};
input UpdateCommentInput {
  text:String

}


`;

