import 'reflect-metadata';
import { COOKIE_NAME, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/posts';
import { UserResolver } from './resolvers/user';
import { createConnection } from 'typeorm';

import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from './types';
import cors from 'cors';
import { User } from './entities/User';
import { Post } from './entities/Post';
import path from 'path';

const main = async () => {
	// Data base connection
	const conn = await createConnection({
		type: 'postgres',
		database: 'lireddit2',
		username: 'knight',
		logging: true,
		synchronize: true,
		migrations: [path.join(__dirname, './migrations/*')],
		entities: [Post, User],
	});
	conn.runMigrations();

	// Express connection
	const app = express();

	const RedisStore = connectRedis(session);
	const redis = new Redis();

	app.use(
		cors({
			origin: 'http://localhost:3000',
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
			secret: 'keyboard cat',
			resave: false,
		})
	);

	// Apollo server
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }): MyContext => ({ req, res, redis }),
	});

	apolloServer.applyMiddleware({
		app,
		cors: {
			origin: false,
		},
	});

	app.listen(4000, () => {
		console.log('Server started at 4000');
	});
	app.get('/', (_, response) => {
		response.send('Hello');
	});
};

main().catch((err) => {
	console.error(err);
});
