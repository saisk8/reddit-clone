import { Heading, Box } from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { usePostQuery } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';

export const Post = ({}) => {
	const router = useRouter();
	const intId =
		typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;
	const [{ data, fetching, error }] = usePostQuery({
		pause: intId === -1,
		variables: {
			id: intId,
		},
	});

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
		</Layout>
	);
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
