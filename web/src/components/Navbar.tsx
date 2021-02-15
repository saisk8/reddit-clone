import { Box, Button, Flex, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
	const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
	const [{ data, fetching }] = useMeQuery();
	let body = null;

	if (fetching) {
		// data is loading
	} else if (!data?.me) {
		// User not logged in
		body = (
			<>
				<NextLink href='/login'>
					<Link>Login</Link>
				</NextLink>
				<NextLink href='/register'>
					<Link ml={4}>Register</Link>
				</NextLink>
			</>
		);
	} else {
		// User logged in
		body = (
			<Box>
				{data.me.username}
				<Button
					variant='link'
					ml={2}
					colorScheme='red'
					onClick={() => logout()}
					isLoading={logoutFetching}
				>
					Logout
				</Button>
			</Box>
		);
	}
	return (
		<Flex bgColor='gray.200'>
			<Box p={4} ml='auto'>
				{body}
			</Box>
		</Flex>
	);
};
export default Navbar;
