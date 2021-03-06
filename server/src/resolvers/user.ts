import { User } from '../entities/User';
import { MyContext } from '../types';
import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
} from 'type-graphql';
import argon2 from 'argon2';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { UserNamePasswordInput } from './UserNamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';
import { getConnection } from 'typeorm';

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

@Resolver(User)
export class UserResolver {
	@FieldResolver(() => String)
	email(@Root() user: User, @Ctx() { req }: MyContext) {
		if ((req.session as any).userId === user.id) {
			return user.email;
		}
		return '';
	}
	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { redis, req }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 2) {
			return {
				errors: [
					{
						field: 'newPassword',
						message: 'Length of the password must be greater than 2',
					},
				],
			};
		}
		const key = FORGET_PASSWORD_PREFIX + token;
		const userId = await redis.get(key);
		if (!userId) {
			return {
				errors: [
					{
						field: 'token',
						message: 'Token expired',
					},
				],
			};
		}

		const userIdNum = parseInt(userId!);
		const user = await User.findOne(userId);
		if (!user) {
			return {
				errors: [
					{
						field: 'Token',
						message: 'User no longer exists',
					},
				],
			};
		}

		// Update password
		await User.update(
			{ id: userIdNum },
			{ password: await argon2.hash(newPassword) }
		);
		await redis.del(key);

		// Log in the user
		(req.session as any).userId = userId;

		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('email') email: string,
		@Ctx() { redis }: MyContext
	) {
		const user = await User.findOne({ where: { email } });
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
	async me(@Ctx() { req }: MyContext) {
		// Query to check who the user is
		console.log(req.session, 'me query');
		if (!(req.session as any).userId) {
			return null;
		}
		return await User.findOne((req.session as any).userId);
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UserNamePasswordInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options);
		if (errors) {
			return { errors };
		}
		const hashedPassword = await argon2.hash(options.password);
		let user;
		try {
			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username: options.username,
					email: options.email,
					password: hashedPassword,
				})
				.returning('*')
				.execute();
			user = result.raw[0];
		} catch (err) {
			if (err.code === '23505') {
				// Duplicate user error
				return {
					errors: [{ field: 'username', message: 'Username already exists' }],
				};
			}
		}
		(req.session as any).userId = user.id;
		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const user = await User.findOne(
			usernameOrEmail.includes('@')
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
		);
		if (!user) {
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: 'Username or email does not exist',
					},
				],
			};
		}
		const isValidPassword = await argon2.verify(user!.password, password);
		if (!isValidPassword) {
			return { errors: [{ field: 'password', message: 'Invalid password' }] };
		}
		(req.session as any).userId = user.id;
		console.log(req.session);
		return { user };
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
