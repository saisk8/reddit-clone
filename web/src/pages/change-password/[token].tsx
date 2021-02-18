import { Box, Button, Link } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/dist/client/router';
import React, { useState } from 'react';
import InputField from '../../components/InputField';
import Wrapper from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { toErrorMap } from '../../utils/toErrorMap';
import NextLink from 'next/link';

export const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
	const [, changePassword] = useChangePasswordMutation();
	const router = useRouter();
	const [tokenError, setTokenError] = useState('');
	console.log(token);
	return (
		<Wrapper variant='small'>
			<Formik
				initialValues={{ newPassword: '' }}
				onSubmit={async (values, { setErrors }) => {
					const respone = await changePassword({
						newPassword: values.newPassword,
						token,
					});
					if (respone.data?.changePassword.errors) {
						const errorMap = toErrorMap(respone.data.changePassword.errors);
						console.log('token', errorMap);
						if (errorMap.token.includes('Token')) {
							console.log('here');
							setTokenError(errorMap.token);
						} else {
							setErrors(errorMap);
						}
					} else if (respone.data?.changePassword.user) {
						// worked
						router.push('/');
					}
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						{tokenError ? (
							<Box>
								{tokenError}
								<NextLink href='/forgot-password'>
									<Link ml={2} color='red'>
										Go forget it again.
									</Link>
								</NextLink>
							</Box>
						) : (
							<>
								<Box mt={4}>
									<InputField
										name='newPassword'
										placeholder='New Password'
										label='New Password'
										type='password'
									></InputField>
								</Box>
								<Button
									mt={4}
									type='submit'
									colorScheme='teal'
									isLoading={isSubmitting}
								>
									Reset
								</Button>{' '}
							</>
						)}
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

ChangePassword.getInitialProps = ({ query }) => {
	return {
		token: query.token as string,
	};
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
