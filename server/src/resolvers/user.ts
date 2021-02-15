import { User } from '../entities/User';
import { MyContext } from '../types';
import {
	Arg,
	Ctx,
	Field,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from 'type-graphql';
import argon2 from 'argon2';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { UserNamePasswordInput } from './UserNamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { EntityManager } from '@mikro-orm/postgresql';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';

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
	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('email') email: string,
		@Ctx() { em, redis }: MyContext
	) {
		const user = await em.findOne(User, { email });
		if (!user) {
			// The email is not in the database
			return true;
		}
		const token = v4();
		await redis.set(
			FORGET_PASSWORD_PREFIX + token,
			user.id,
			'ex',
			1000 * 60 * 60 * 24 * 3 // three days
		);
		const html = `<a href='http://localhost:3000/change-password/${token}'>Reset password</a>`;
		await sendEmail(email, html);
		return true;
	}

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
		const errors = validateRegister(options);
		if (errors) {
			return { errors };
		}
		const hashedPassword = await argon2.hash(options.password);
		// const user = em.create(User, {
		// 	username: options.username,
		// 	password: hashedPassword,
		// 	email: options.email,
		// });

		let user;
		try {
			const result = await (em as EntityManager)
				.createQueryBuilder(User)
				.getKnexQuery()
				.insert({
					username: options.username,
					email: options.email,
					password: hashedPassword,
					created_at: new Date(),
					updated_at: new Date(),
				})
				.returning('*');
			user = result[0];
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
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(
			User,
			usernameOrEmail.includes('@')
				? { email: usernameOrEmail }
				: { username: usernameOrEmail }
		);
		if (!user) {
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: `Username or email does not exist`,
					},
				],
			};
		}
		const isValidPassword = await argon2.verify(user!.password, password);
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
