import React from 'react';
import { Form, Formik } from 'formik';
import Wrapper from '../components/Wrapper';
import InputField from '../components/InputField';
import { Box, Button } from '@chakra-ui/react';

interface registerProps {}

export const Register: React.FC<registerProps> = ({}) => {
	return (
		<Wrapper variant='small'>
			<Formik
				initialValues={{ username: '', password: '' }}
				onSubmit={(values) => {
					console.log(values);
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name='username'
							placeholder='Username'
							label='Username'
						></InputField>
						<Box mt={4}>
							<InputField
								name='password'
								placeholder='Password'
								label='Password'
								type='password'
							></InputField>
						</Box>
						<Button
							mt={4}
							type='submit'
							colorScheme='teal'
							isLoading={isSubmitting}
						>
							Register
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

export default Register;
