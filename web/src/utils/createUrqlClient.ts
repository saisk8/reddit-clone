import { cacheExchange, Resolver } from '@urql/exchange-graphcache';
import { dedupExchange, fetchExchange, stringifyVariables } from 'urql';
import {
	LogoutMutation,
	MeQuery,
	MeDocument,
	LoginMutation,
	RegisterMutation,
	VoteMutationVariables,
} from '../generated/graphql';
import gql from 'graphql-tag';
import { betterUpdateQuery } from './betterUpdateQuery';
import { pipe, tap } from 'wonka';
import { Exchange } from 'urql';
import Router from 'next/router';

const errorExchange: Exchange = ({ forward }) => (ops$) => {
	return pipe(
		forward(ops$),
		tap(({ error }) => {
			if (error?.message.includes('not authenticated')) {
				Router.replace('/login');
			}
		})
	);
};

export const cursorPagination = (): Resolver => {
	return (_parent, fieldArgs, cache, info) => {
		const { parentKey: entityKey, fieldName } = info;

		const allFields = cache.inspectFields(entityKey);
		const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
		const size = fieldInfos.length;
		if (size === 0) {
			return undefined;
		}

		const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;

		info.partial = !cache.resolve(
			cache.resolve(entityKey, fieldKey) as string,
			'posts'
		);
		let hasMore = true;
		const results: string[] = [];
		fieldInfos.forEach((fi) => {
			const key = cache.resolve(entityKey, fi.fieldKey) as string;
			const data = cache.resolve(key, 'posts') as string[];
			const _hasmore = cache.resolve(key, 'hasMore');
			if (!_hasmore) hasMore = _hasmore as boolean;
			results.push(...data);
		});

		return { __typename: 'PaginatedPosts', hasMore, posts: results };

		// const visited = new Set();
		// let result: NullArray<string> = [];
		// let prevOffset: number | null = null;

		// for (let i = 0; i < size; i++) {
		// 	const { fieldKey, arguments: args } = fieldInfos[i];
		// 	if (args === null || !compareArgs(fieldArgs, args)) {
		// 		continue;
		// 	}

		// 	const links = cache.resolve(entityKey, fieldKey) as string[];
		// 	const currentOffset = args[cursorArgument];

		// 	if (
		// 		links === null ||
		// 		links.length === 0 ||
		// 		typeof currentOffset !== 'number'
		// 	) {
		// 		continue;
		// 	}

		// 	const tempResult: NullArray<string> = [];

		// 	for (let j = 0; j < links.length; j++) {
		// 		const link = links[j];
		// 		if (visited.has(link)) continue;
		// 		tempResult.push(link);
		// 		visited.add(link);
		// 	}

		// 	if (
		// 		(!prevOffset || currentOffset > prevOffset) ===
		// 		(mergeMode === 'after')
		// 	) {
		// 		result = [...result, ...tempResult];
		// 	} else {
		// 		result = [...tempResult, ...result];
		// 	}

		// 	prevOffset = currentOffset;
		// }

		// const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
		// if (hasCurrentPage) {
		// 	return result;
		// } else if (!(info as any).store.schema) {
		// 	return undefined;
		// } else {
		// 	info.partial = true;
		// 	return result;
		// }
	};
};

export const createUrqlClient = (ssrExchange: any) => ({
	url: 'http://localhost:4000/graphql',
	fetchOptions: {
		credentials: 'include' as const,
	},
	exchanges: [
		dedupExchange,
		cacheExchange({
			keys: {
				PaginatedPosts: () => null,
			},
			resolvers: {
				Query: {
					posts: cursorPagination(),
				},
			},
			updates: {
				Mutation: {
					vote: (_result, args, cache, __) => {
						const { postId, value } = args as VoteMutationVariables;
						const data = cache.readFragment(
							gql`
								fragment _ on Post {
									points
									id
								}
							`,
							{ id: postId }
						);
						if (data) {
							const newPoints = data.points + value;
							cache.writeFragment(
								gql`
									fragment __ on Post {
										points
									}
								`,
								{ id: postId, points: newPoints }
							);
						}
					},
					createPost: (_result, _, cache, __) => {
						const allFields = cache.inspectFields('Query');
						const fieldInfos = allFields.filter(
							(info) => info.fieldName === 'posts'
						);
						fieldInfos.forEach((fi) => {
							cache.invalidate('Query', 'posts', fi.arguments || {});
						});
					},
					logout: (_result, _, cache, __) => {
						betterUpdateQuery<LogoutMutation, MeQuery>(
							cache,
							{ query: MeDocument },
							_result,
							() => ({ me: null })
						);
					},
					login: (_result, _, cache, __) => {
						betterUpdateQuery<LoginMutation, MeQuery>(
							cache,
							{ query: MeDocument },
							_result,
							(result, query) => {
								if (result.login.errors) {
									return query;
								} else {
									return {
										me: result.login.user,
									};
								}
							}
						);
					},
					register: (_result, _, cache, __) => {
						betterUpdateQuery<RegisterMutation, MeQuery>(
							cache,
							{ query: MeDocument },
							_result,
							(result, query) => {
								if (result.register.errors) {
									return query;
								} else {
									return {
										me: result.register.user,
									};
								}
							}
						);
					},
				},
			},
		}),
		errorExchange,
		ssrExchange,
		fetchExchange,
	],
});
