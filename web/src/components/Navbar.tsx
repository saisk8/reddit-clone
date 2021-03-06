import { Box, Button, Flex, Link, Heading } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
	const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
	const [{ data, fetching }] = useMeQuery({
		pause: isServer(),
	});
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
			<Flex align='center'>
				<NextLink href='/create-post'>
					<Button as={Link} mr={4} colorScheme='blue'>
						Create post
					</Button>
				</NextLink>
				<Box mr={2}>{data.me.username}</Box>
				<Button
					variant='link'
					ml={2}
					colorScheme='red'
					onClick={() => logout()}
					isLoading={logoutFetching}
				>
					Logout
				</Button>
			</Flex>
		);
	}
	return (
		<Flex zIndex={1} position='sticky' top={0} bg='gray.200' p={4}>
			<Flex flex={1} m='auto' align='center' maxW={800}>
				<NextLink href='/'>
					<Link>
						<Heading>LiReddit</Heading>
					</Link>
				</NextLink>
				<Box ml={'auto'}>{body}</Box>
			</Flex>
		</Flex>
	);
};
export default Navbar;
