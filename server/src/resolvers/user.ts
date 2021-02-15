import { User } from '../entities/User';
import { MyContext } from '../types';
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from 'type-graphql';
import argon2 from 'argon2';
import { COOKIE_NAME } from '../constants';

@InputType()
class UserNamePasswordInput {
	@Field()
	username: string;
	@Field()
	password: string;
}

@ObjectType()
class FieldError {
	@Field()
	field: string;
	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Query(() => User, { nullable: true })
	async me(@Ctx() { req, em }: MyContext) {
		// Query to check who the user is
		if (!(req.session as any).userId) {
			return null;
		}
		const user = await em.findOne(User, { id: (req.session as any).userId });
		return user;
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UserNamePasswordInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {
		if (options.username.length <= 2) {
			return {
				errors: [
					{
						field: 'username',
						message: 'Username should have at least 3 characters',
					},
				],
			};
		}

		if (options.password.length <= 2) {
			return {
				errors: [
					{
						field: 'password',
						message: 'Password should have at least 3 characters',
					},
				],
			};
		}
		const hashedPassword = await argon2.hash(options.password);
		const user = em.create(User, {
			username: options.username,
			password: hashedPassword,
		});
		try {
			await em.persistAndFlush(user);
		} catch (err) {
			if (err.code === '23505') {
				// Duplicate user error
				return {
					errors: [{ field: 'username', message: 'Username already exists' }],
				};
			}
		}
		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('options') options: UserNamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(User, { username: options.username });
		if (!user) {
			return {
				errors: [{ field: 'username', message: `Username does not exist` }],
			};
		}
		const isValidPassword = await argon2.verify(
			user!.password,
			options.password
		);
		if (!isValidPassword) {
			return { errors: [{ field: 'password', message: `Invalid password` }] };
		}
		await em.persistAndFlush(user!);
		(req.session as any).userId = user.id;
		return { user: user! };
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext) {
		return new Promise((resolve) =>
			req.session.destroy((err) => {
				res.clearCookie(COOKIE_NAME);
				if (err) {
					resolve(false);
					return;
				}
				resolve(true);
			})
		);
	}
}
