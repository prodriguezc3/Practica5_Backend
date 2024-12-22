import { Collection, IdPInfo, ObjectId } from "mongodb";
import {
  User_M,
  Post_M,
  Comment_M,
  CreateUserInput,
  UpdateUserInput,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  UpdateCommentInput,
} from "./types.ts";
import { GraphQLError, ParseOptions } from "graphql";

/* New Libraries:

>ClientSession: unnecessary in this scenario
>GraphQLError:  Añadir en terminal biblio (como la de mongodb) -> deno add npm:graphql

*/

//save up time, all the possible context arrays in here
type Context = {
  UserCollection: Collection<User_M>;
  PostCollection: Collection<Post_M>;
  CommentCollection: Collection<Comment_M>;
};

type QueryArgs = {
  id: string;
};

type LikePostsArgs = {
  postId: string;
  userId: string;
};

export const resolvers = {
  //Ponemos los types declarados en el schema
  //Hacemos solo los atributos que sean medio weird, aka que tengan un tipo "diff" por "traducir".
  User: {
    id: (parent: User_M) => {
      return parent._id?.toString();
    },
    /*IMPORTANT: AQUI EL PARENTS ES USER_M NOT POSTS M. IF YOU DONT DO THIS, THEN WHEN WE CREATE 
        THE IDS CNST, WE WONT GET THE CORRESPONDING METHOD TO POSTS.*/
    posts: async (parent: User_M, _: unknown, ctx: Context) => {
      const P_ids = parent.posts;
      return await ctx.PostCollection.find({ _id: { $in: P_ids } }).toArray();
      //que hace esta linea:
    }, //these commas are v imp. fyi

    comments: async (parent: User_M, _: unknown, ctx: Context) => {
      const C_ids = parent.comments;
      return await ctx.CommentCollection.find({
        _id: { $in: C_ids },
      }).toArray();
    },

    likedPosts: async (parent: User_M, _: unknown, ctx: Context) => {
      const LP_ids = parent.likedPosts;
      return await ctx.PostCollection.find({ _id: { $in: LP_ids } }).toArray(); //este usa post collection pq hace referencia a posts, no tiene su propio tipo
    },
  },

  Post: {
    id: (parent: Post_M) => {
      return parent._id?.toString();
    },

    author: async (parent: Post_M, _: unknown, ctx: Context) => {
      return await ctx.UserCollection.findOne({ _id: parent.author });
    },

    comments: async (parent: Post_M, _: unknown, ctx: Context) => {
      const C_ids = parent.comments;
      return await ctx.CommentCollection.find({
        _id: { $in: C_ids },
      }).toArray();
    },

    likes: async (parent: Post_M, _: unknown, ctx: Context) => {
      const L_ids = parent.likes;
      return await ctx.UserCollection.find({ _id: { $in: L_ids } }).toArray();
    }, //pensaba que likes era de tipo number, pero lo que queremos es mostrar los usuarios
    // que le han dado like entonces es otro array de toda la vida. PIIIILAAASSSS
  },

  Comment: {
    //aqui como todos son directos, es decir, no son array, los llamamos relax.
    id: (parent: Comment_M) => {
      return parent._id?.toString(); //aqui con ? pq puede que no exista
    },

    author: async (parent: Comment_M, _: unknown, ctx: Context) => {
      return await ctx.UserCollection.findOne({ _id: parent.author });
    },

    post: async (parent: Comment_M, _: unknown, ctx: Context) => {
      return await ctx.PostCollection.findOne({ _id: parent.post });
    },
  },

  //Ponemos los queries
  Query: {
    users: async (_: unknown, __: unknown, ctx: Context): Promise<User_M[]> => {
      //importante que 1st unkown es 1_, 2ndo son dos __
      const users = await ctx.UserCollection.find().toArray();
      return users;
    },

    user: async (
      _: unknown,
      args: QueryArgs,
      ctx: Context
    ): Promise<User_M | null> => {
      //null como valero
      const iD = new ObjectId(args.id); //nuestros IDs hay que convertirles

      const user = await ctx.UserCollection.findOne({ _id: iD }); //buscamos nuestro UNICO ID en el array correspondiente
      //esta funcion sera standard para todos.
      return user;
    },

    posts: async (_: unknown, __: unknown, ctx: Context): Promise<Post_M[]> => {
      const posts = await ctx.PostCollection.find().toArray();
      return posts;
    },
    post: async (
      _: unknown,
      args: QueryArgs,
      ctx: Context
    ): Promise<Post_M | null> => {
      const iD = new ObjectId(args.id);

      const post = await ctx.PostCollection.findOne({ _id: iD });
      return post;
    },

    comments: async (
      _: unknown,
      __: unknown,
      ctx: Context
    ): Promise<Comment_M[]> => {
      const comments = await ctx.CommentCollection.find().toArray();
      return comments;
    },
    comment: async (
      _: unknown,
      args: QueryArgs,
      ctx: Context
    ): Promise<Comment_M | null> => {
      const iD = new ObjectId(args.id);

      const comment = await ctx.CommentCollection.findOne({ _id: iD });
      return comment;
    },
  },

  Mutation: {
    createUser: async (
      _: unknown,
      { input }: { input: CreateUserInput },
      ctx: Context
    ): Promise<User_M | null> => {
      //| NULL IMPORTANTE CON EL RETURN

      const Buscar_User = await ctx.UserCollection.findOne({
        email: input.email,
      }); //proving

      if (Buscar_User) {
        throw new Error("ERROR: Usuario ya existe");
      }

      const newID = await ctx.UserCollection.insertOne({
        name: input.name,
        password: input.password,
        email: input.email,
        posts: [],
        comments: [],
        likedPosts: [],
      }); //de toda la vida

      const user = await ctx.UserCollection.findOne({ _id: newID });

      return user;
    },

    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
      ctx: Context
    ): Promise<User_M> => {
      const Buscar_User = await ctx.UserCollection.findOne({
        email: input.email,
      });

      if (Buscar_User && Buscar_User._id.toString() != id) {
        throw new Error("ERROR: Email ya ha sido usado ");
      }

      await ctx.UserCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: input.name,
            password: input.password,
            email: input.email,
            posts: [],
            comments: [],
            likedPosts: [],
          },
        }
      );

      const user = await ctx.UserCollection.findOne({ _id: new ObjectId(id) });

      if (user) {
        return user;
      } else {
        throw new Error("ERROR: Usuario no encontrado");
      }
    },

    deleteUser: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ): Promise<boolean> => {
      const iD = new ObjectId(args.id);

      const Buscar_User = await ctx.UserCollection.findOne({ _id: iD });

      if (!Buscar_User) {
        //si le ponemos en true, y haces false como else, statement
        throw new Error("ERROR: Usuario no encontrado");
      } else {
        await ctx.UserCollection.deleteOne({ _id: iD }); //borramos unico id del array Usuarios
        await ctx.PostCollection.deleteMany({ author: iD }); //borramos todos los posts del Usuario, array Post
        await ctx.CommentCollection.deleteMany({ author: iD }); //borramos todos los comments del Array Post, del Usuario

        const like = Buscar_User.likedPosts;

        await ctx.PostCollection.updateMany(
          { _id: { $in: like } },
          { $pull: { likes: iD } }
        );
        return true;
      }
    },

    createPost: async (
      _: unknown,
      { input }: { input: CreatePostInput },
      ctx: Context
    ): Promise<Post_M | null> => {
      //dos personas pueden hacer el mismo post, unica diferencia seria el id del post, que al crearlo seran diferentes

      const newID = await ctx.PostCollection.insertOne({
        content: input.content,
        author: new ObjectId(input.author),
        comments: [],
        likes: [],
      }); //de toda la vida

      const post = await ctx.PostCollection.findOne({ _id: newID });

      return post;
    },

    updatePost: async (
      _: unknown,
      { id, input }: { id: string; input: UpdatePostInput },
      ctx: Context
    ): Promise<Post_M> => {
      const iD = new ObjectId(id);

      await ctx.PostCollection.updateOne(
        { _id: iD },
        {
          $set: {
            content: input.content,
          },
        }
      );

      const post = await ctx.PostCollection.findOne({ _id: new ObjectId(id) });

      if (post) {
        return post;
      } else {
        throw new Error("ERROR: Usuario no encontrado");
      }
    },
    deletePost: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ): Promise<boolean> => {
      const iD = new ObjectId(args.id);

      const Buscar_Post = await ctx.PostCollection.findOne({ _id: iD });

      if (!Buscar_Post) {
        //si le ponemos en true, y haces false como else, statement
        throw new Error("ERROR: Post no encontrado");
      } else {
        await ctx.PostCollection.deleteOne({ _id: iD }); //borramos el post del array de posts
        return true;
      }
    },

    addLikeToPost: async (
      _: unknown,
      args: LikePostsArgs,
      ctx: Context
    ): Promise<Post_M | null> => {
      const p_ID = new ObjectId(args.postId);
      const u_ID = new ObjectId(args.userId);

      const Existe_User = await ctx.UserCollection.findOne({ _id: u_ID });

      if (!Existe_User) {
        throw new Error("ERROR: Usuario no existe");
      }

      const Existe_Post = await ctx.PostCollection.findOne({ _id: p_ID });

      if (!Existe_Post) {
        throw new Error("ERROR: Post no existe");
      }

      const L_post = await ctx.PostCollection.findOneAndUpdate(
        { _id: p_ID },
        { $push: { likes: u_ID } }
      );

      await ctx.UserCollection.updateOne(
        { _id: u_ID },
        { $push: { likedPosts: p_ID } }
      );

      return L_post;
    },

    removeLikeFromPost: async (
      _: unknown,
      args: LikePostsArgs,
      ctx: Context
    ): Promise<Post_M|null> => {
      const p_ID = new ObjectId(args.postId);
      const u_ID = new ObjectId(args.userId);

      const Existe_User = await ctx.UserCollection.findOne({ _id: u_ID });
      if (!Existe_User) {
        throw new Error("ERROR: Usuario no encontrado");
      }

      const RL_post = await ctx.PostCollection.findOneAndUpdate(
        { _id: p_ID },
        { $pull: { likes: u_ID } }
      );

      if (!RL_post) {
        throw new Error("ERROR: Post no encontrado");
      }

      await ctx.UserCollection.updateOne(
        { _id: u_ID },
        { $pull: { likedPosts: p_ID } }
      );

      return RL_post;
    },

    createComment: async (
      _: unknown,
      { input }: { input: CreateCommentInput },
      ctx: Context
    ): Promise<Comment_M | null> => {
      const newID = await ctx.CommentCollection.insertOne({
        text: input.text,
        author: input.author,
        post: input.post,
      });

      const comment = await ctx.CommentCollection.findOne({ _id: newID });

      return comment;
    },
    updateComment: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateCommentInput },
      ctx: Context
    ): Promise<Comment_M> => {
      await ctx.CommentCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            text: input.text,
          },
        }
      );

      const comment = await ctx.CommentCollection.findOne({
        _id: new ObjectId(id),
      });

      if (comment) {
        return comment;
      } else {
        throw new Error("ERROR: Usuario no encontrado");
      }
    },
    deleteComment: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ): Promise<boolean> => {
      const iD = new ObjectId(args.id);

      const Buscar_Comment = await ctx.CommentCollection.findOne({ _id: iD });

      if (!Buscar_Comment) {
        //si le ponemos en true, y haces false como else, statement
        throw new Error("ERROR: Comentario no encontrado");
      } else {
        await ctx.CommentCollection.deleteOne({ _id: iD }); //borramos el comentario del array de comentarios
        return true;
      }
    },
  },
};
