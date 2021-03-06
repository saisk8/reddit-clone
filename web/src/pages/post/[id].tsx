import { Heading, Box } from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import Layout from '../../components/Layout';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { EditDeletePostButtons } from '../../components/EditDeletePostButtons';
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl';

export const Post = ({}) => {
	const [{ data, fetching, error }] = useGetPostFromUrl();

	if (fetching) return <Box>Loading...</Box>;

	if (error) {
		return <Box>{error.message}</Box>;
	}

	if (!data?.post)
		return (
			<Layout>
				<Box>No such post</Box>
			</Layout>
		);

	return (
		<Layout>
			<Heading mb={4}>{data?.post?.title}</Heading>
			<Box mb={4}>{data?.post?.text}</Box>
			<EditDeletePostButtons
				id={data.post.id}
				creatorId={data.post.creator.id}
			/>
		</Layout>
	);
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
