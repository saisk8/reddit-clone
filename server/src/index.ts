import 'reflect-metadata';
import { COOKIE_NAME, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/posts';
import { UserResolver } from './resolvers/user';
import { createConnection } from 'typeorm';
import 'dotenv-safe/config';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from './types';
import cors from 'cors';
import { User } from './entities/User';
import { Post } from './entities/Post';
import path from 'path';
import { Updoot } from './entities/Updoot';
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';

const main = async () => {
	// Data base connection
	const conn = await createConnection({
		type: 'postgres',
		url: process.env.DATABASE_URL,
		logging: true,
		synchronize: true,
		migrations: [path.join(__dirname, './migrations/*')],
		entities: [Post, User, Updoot],
	});
	conn.runMigrations();
	// await Post.delete({});

	// Express connection
	const app = express();

	const RedisStore = connectRedis(session);
	const redis = new Redis(process.env.REDIS_URL);

	app.use(
		cors({
			origin: process.env.CORS_ORIGIN,
			credentials: true,
		})
	);
	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({ client: redis, disableTouch: true }),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
				httpOnly: true,
				secure: __prod__,
				sameSite: 'lax', // csrf
			},
			saveUninitialized: false,
			secret: process.env.SESSION_SECRET as string,
			resave: false,
		})
	);

	// Apollo server
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }): MyContext => ({
			req,
			res,
			redis,
			updootLoader: createUpdootLoader(),
			userLoader: createUserLoader(),
		}),
	});

	apolloServer.applyMiddleware({
		app,
		cors: {
			origin: false,
		},
	});

	app.listen(process.env.PORT, () => {
		console.log('Server started at 4000');
	});
	app.get('/', (_, response) => {
		response.send('Hello');
	});
};

main().catch((err) => {
	console.error(err);
});
