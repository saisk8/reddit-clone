import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
// import { useRouter } from 'next/dist/client/router';
import React from 'react';
import InputField from '../../components/InputField';
import Wrapper from '../../components/Wrapper';
// import { toErrorMap } from '../../utils/toErrorMap';

export const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
	// const router = useRouter();
	console.log(token);
	return (
		<Wrapper variant='small'>
			<Formik
				initialValues={{ newPassword: '' }}
				// onSubmit={async (values, { setErrors }) => {
				// 	const respone = await login(values);
				// 	if (respone.data?.login.errors) {
				// 		setErrors(toErrorMap(respone.data.login.errors));
				// 	} else if (respone.data?.login.user) {
				// 		// worked
				// 		router.push('/');
				// 	}
				// }}
			>
				{({ isSubmitting }) => (
					<Form>
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
						</Button>
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

export default ChangePassword;
