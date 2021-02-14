import { User } from '../entities/User';
import { MyContext } from '../types';
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from 'type-graphql';
import argon2 from 'argon2';

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
	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UserNamePasswordInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {
		if (options.username.length <= 2) {
			return {
				errors: [{ field: 'username', message: 'Username should have at least 3 characters' }],
			};
		}

		if (options.password.length <= 2) {
			return {
				errors: [{ field: 'password', message: 'Password should have at least 3 characters' }],
			};
		}
		const hashedPassword = await argon2.hash(options.password);
		const user = em.create(User, { username: options.username, password: hashedPassword });
		try {
			await em.persistAndFlush(user);
		} catch (err) {
			if (err.code === '23505') {
				// Duplicate user error
				return { errors: [{ field: 'username', message: 'Username already exists' }] };
			}
		}
		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('options') options: UserNamePasswordInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(User, { username: options.username });
		if (!user) {
			return { errors: [{ field: 'username', message: `Username does not exist` }] };
		}
		const isValidPassword = await argon2.verify(user!.password, options.password);
		if (!isValidPassword) {
			return { errors: [{ field: 'password', message: `Invalid password` }] };
		}
		await em.persistAndFlush(user!);
		return { user: user! };
	}
}
