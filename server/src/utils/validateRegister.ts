import { UserNamePasswordInput } from 'src/resolvers/UserNamePasswordInput';

export const validateRegister = (options: UserNamePasswordInput) => {
	if (!options.email.includes('@')) {
		return [
			{
				field: 'email',
				message: 'Invalid email',
			},
		];
	}
	if (options.username.length <= 2) {
		return [
			{
				field: 'username',
				message: 'Username should have at least 3 characters',
			},
		];
	}

	if (options.username.includes('@')) {
		return [
			{
				field: 'username',
				message: 'Username cannot have @ character',
			},
		];
	}

	if (options.password.length <= 2) {
		return [
			{
				field: 'password',
				message: 'Password should have at least 3 characters',
			},
		];
	}

	return null;
};
