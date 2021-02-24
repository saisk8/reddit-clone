import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import InputField from '../components/InputField';
import Layout from '../components/Layout';
import { useCreatePostMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { useIsAuth } from '../utils/useIsAuth';

export const CreatePost: React.FC<{}> = ({}) => {
	const [, createPost] = useCreatePostMutation();
	const router = useRouter();
	useIsAuth();
	return (
		<Layout variant='small'>
			<Formik
				initialValues={{ title: '', text: '' }}
				onSubmit={async (values) => {
					const { error } = await createPost({ input: values });
					if (!error) router.push('/');
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name='title'
							placeholder='Title'
							label='Title '
						></InputField>
						<Box mt={4}>
							<InputField
								name='text'
								placeholder='Text...'
								label='Body'
								textarea
							></InputField>
						</Box>

						<Button
							mt={2}
							type='submit'
							colorScheme='teal'
							isLoading={isSubmitting}
						>
							Create Post
						</Button>
					</Form>
				)}
			</Formik>
		</Layout>
	);
};
export default withUrqlClient(createUrqlClient)(CreatePost);
