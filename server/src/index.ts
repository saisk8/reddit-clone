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

const main = async () => {
	// Data base connection
	const orm = await MikroORM.init(microConfig);
	orm.getMigrator().up();
	// Express connection
	const app = express();

	// Apollo server
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: () => ({ em: orm.em }),
	});

	apolloServer.applyMiddleware({ app });

	app.listen(3000, () => {
		console.log('Server started at 3000');
	});
	app.get('/', (_, response) => {
		response.send('Hello');
	});
};

main().catch((err) => {
	console.error(err);
});
