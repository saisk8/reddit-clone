import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/posts';
import { UserResolver } from './resolvers/user';

import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from './types';
import cors from 'cors';

const main = async () => {
	// Data base connection
	const orm = await MikroORM.init(microConfig);
	orm.getMigrator().up();
	// Express connection
	const app = express();

	const RedisStore = connectRedis(session);
	const redisClient = redis.createClient();

	app.use(
		cors({
			origin: 'http://localhost:3000',
			credentials: true,
		})
	);
	app.use(
		session({
			name: 'cat',
			store: new RedisStore({ client: redisClient, disableTouch: true }),
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
		context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
	});

	apolloServer.applyMiddleware({
		app,
		cors: {
			origin: false,
		},
	});

	app.listen(4000, () => {
		console.log('Server started at 3000');
	});
	app.get('/', (_, response) => {
		response.send('Hello');
	});
};

main().catch((err) => {
	console.error(err);
});
