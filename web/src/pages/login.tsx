import React from 'react';
import { Form, Formik } from 'formik';
import Wrapper from '../components/Wrapper';
import InputField from '../components/InputField';
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/dist/client/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link';

interface loginProps {}

export const Login: React.FC<loginProps> = ({}) => {
	const [, login] = useLoginMutation();
	const router = useRouter();
	return (
		<Wrapper variant='small'>
			<Formik
				initialValues={{ usernameOrEmail: '', password: '' }}
				onSubmit={async (values, { setErrors }) => {
					const respone = await login(values);
					if (respone.data?.login.errors) {
						setErrors(toErrorMap(respone.data.login.errors));
					} else if (respone.data?.login.user) {
						if (typeof router.query.next === 'string') {
							router.push(router.query.next);
						} else router.push('/');
					}
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name='usernameOrEmail'
							placeholder='Username or Email'
							label='Username or Email'
						></InputField>
						<Box mt={4}>
							<InputField
								name='password'
								placeholder='Password'
								label='Password'
								type='password'
							></InputField>
						</Box>
						<Flex>
							<NextLink href='/forgot-password'>
								<Link ml='auto' mt={4}>
									Forgot password
								</Link>
							</NextLink>
						</Flex>
						<Button
							mt={2}
							type='submit'
							colorScheme='teal'
							isLoading={isSubmitting}
						>
							Login
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

export default withUrqlClient(createUrqlClient)(Login);
