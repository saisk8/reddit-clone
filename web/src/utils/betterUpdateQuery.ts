import { Cache, QueryInput } from '@urql/exchange-graphcache';

export function betterUpdateQuery<Result, Query>(
	cache: Cache,
	queryInput: QueryInput,
	result: any,
	fn: (res: Result, query: Query) => Query
) {
	cache.updateQuery(queryInput, (data) => fn(result, data as any) as any);
}
