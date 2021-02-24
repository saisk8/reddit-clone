import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import React, { useEffect } from 'react';
import InputField from '../components/InputField';
import Layout from '../components/Layout';
import { useCreatePostMutation, useMeQuery } from '../generated/graphql';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';

export const CreatePost: React.FC<{}> = ({}) => {
	const router = useRouter();
	const [, createPost] = useCreatePostMutation();
	const [{ data, fetching }] = useMeQuery();
	useEffect(() => {
		if (!fetching && !data?.me) router.replace('/login');
	}, [fetching, data, router]);
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
								name='Text'
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
