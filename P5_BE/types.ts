import { OptionalId, ObjectId } from "mongodb";

/*remember: 
->Sintaxis TS: 
    atributo? = opcional
    atributo = mandatorio

    number = numero
    string = string

->Sintaxis GQL:
    atributo = opcional
    atributo! = mandatorio

    Int = numero
    String = string

*/

//normales
export type User = {
  id: string;
  name: string;
  password: string;
  email: string;
  posts: Post[];
  comments: Comment[];
  likedPosts: Post[];
};

export type Post = {

    id:string,
    content:string,
    author:User,
    comments:Comment[],
    likes:User[]
    
};

export type Comment = {
  id: string;
  text: string;
  author: User;
  post: Post;
};

//modelos
export type User_M = OptionalId<{
  //_id: ObjectId
  name: string;
  password: string;
  email: string;
  posts: ObjectId[];
  comments: ObjectId[];
  likedPosts: ObjectId[];
}>;

export type Post_M = OptionalId <{
  content: string;
  author: ObjectId;
  comments: ObjectId[];
  likes: ObjectId[];
}>;

export type Comment_M = OptionalId <{
    text: string,
    author: ObjectId,
    post: ObjectId,
    
}>;

//inputs

//TIPO INPUT!!!!
export type CreateUserInput = {
  name:string
  password:string
  email:string
};

export type UpdateUserInput = {
  name:string;
  password:string;
  email:string;
};


export type CreatePostInput = {
content: string;
author: ObjectId;
};
export type UpdatePostInput = {
content: string;
};


export type CreateCommentInput = {
  text: string;
  author: ObjectId;
  post: ObjectId;
};
export type UpdateCommentInput = {
text: string;

}
