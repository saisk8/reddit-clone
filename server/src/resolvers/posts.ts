import { Post } from '../entities/Post';
import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';

@InputType()
class PostInput {
	@Field()
	title: string;
	@Field()
	text: string;
}

@ObjectType()
class PaginatedPosts {
	@Field(() => [Post])
	posts: Post[];
	@Field()
	hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String)
	textSnippet(@Root() root: Post) {
		return root.text.slice(0, 50);
	}

	@FieldResolver(() => User)
	creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
		return userLoader.load(post.creatorId);
	}

	@FieldResolver(() => Int, { nullable: true })
	async voteStatus(
		@Root() post: Post,
		@Ctx() { updootLoader, req }: MyContext
	) {
		if (!(req.session as any).userId) {
			return null;
		}

		const updoot = await updootLoader.load({
			postId: post.id,
			userId: (req.session as any).userId,
		});

		return updoot ? updoot.value : null;
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async vote(
		@Arg('postId', () => Int) postId: number,
		@Arg('value', () => Int) value: number,
		@Ctx() { req }: MyContext
	) {
		const isUpdoot = value !== -1;
		const realValue = isUpdoot ? 1 : -1;
		const { userId } = req.session as any;
		const updoot = await Updoot.findOne({ where: { postId, userId } });

		// the user has voted on the post before
		// and they are changing their vote
		if (updoot && updoot.value !== realValue) {
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
    update updoot
    set value = $1
    where "postId" = $2 and "userId" = $3
        `,
					[realValue, postId, userId]
				);

				await tm.query(
					`
          update post
          set points = points + $1
          where id = $2
        `,
					[2 * realValue, postId]
				);
			});
		} else if (!updoot) {
			// has never voted before
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
    insert into updoot ("userId", "postId", value)
    values ($1, $2, $3)
        `,
					[userId, postId, realValue]
				);

				await tm.query(
					`
    update post
    set points = points + $1
    where id = $2
      `,
					[realValue, postId]
				);
			});
		}
		return true;
	}

	@Query(() => PaginatedPosts)
	async posts(
		@Arg('limit', () => Int) limit: number,
		@Arg('cursor', () => String, { nullable: true }) cursor: string | null
	): Promise<PaginatedPosts> {
		const realLimit = Math.min(50, limit);
		const psuedoRealLimit = realLimit + 1;
		const replacements: any[] = [psuedoRealLimit];

		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}

		const posts = await getConnection().query(
			`
		select p.*
		from post p
		${cursor ? `where p."createdAt" < $3` : ''}
		order by p."createdAt" DESC
		limit $1
		`,
			replacements
		);

		return {
			posts: posts.slice(0, realLimit),
			hasMore: posts.length === psuedoRealLimit,
		};
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
		return Post.findOne(id, { relations: ['creator'] });
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	async createPost(
		@Arg('input') input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post> {
		return Post.create({
			...input,
			creatorId: (req.session as any).userId,
		}).save();
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg('id') id: number,
		@Arg('title', () => String, { nullable: true }) title: string
	): Promise<Post | null> {
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}
		if (typeof title !== undefined) {
			await Post.update({ id }, { title });
		}
		return post;
	}

	@Mutation(() => Boolean)
	async deletePost(@Arg('id') id: number): Promise<boolean> {
		await Post.delete(id);
		return true;
	}
}
