import { Box } from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import Navbar from '../components/Navbar';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
	const [{ data }] = usePostsQuery();
	return (
		<Box>
			<Navbar />
			<div>Hello World</div> <br />
			{!data ? (
				<div>Loading...</div>
			) : (
				data?.posts.map((p) => <div key={p.id}>{p.title}</div>)
			)}
		</Box>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
