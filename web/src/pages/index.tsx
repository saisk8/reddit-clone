import { DeleteIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Flex,
	Heading,
	IconButton,
	Link,
	Stack,
	Text,
} from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import React, { useState } from 'react';
import Layout from '../components/Layout';
import UpdootSection from '../components/UpdootSection';
import { useDeletePostMutation, usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
	const [variables, setVariables] = useState({
		limit: 10,
		cursor: null as null | string,
	});
	const [{ data, fetching }] = usePostsQuery({
		variables,
	});
	const [, deletePost] = useDeletePostMutation();
	if (!fetching && !data) {
		return <div>You got no posts for some reason.</div>;
	}

	return (
		<Layout>
			{!data && fetching ? (
				<div>Loading...</div>
			) : (
				<Stack spacing={8}>
					{data?.posts.posts.map((p) =>
						!p ? null : (
							<Flex key={p.id} p={5} shadow='md' borderWidth='1px'>
								<UpdootSection post={p} />
								<Box flex={1}>
									<NextLink href='/post/[id]' as={`/post/${p.id}`}>
										<Link>
											<Heading fontSize='xl'>{p.title}</Heading>
										</Link>
									</NextLink>
									<Text>Posted by {p.creator.username}</Text>
									<Flex align='center'>
										<Text mt={4} flex={1}>
											{p.textSnippet}
										</Text>
										<IconButton
											ml='auto'
											aria-label='Delete current post'
											icon={<DeleteIcon color='tomato' />}
											onClick={() => {
												deletePost({ id: p.id });
											}}
										></IconButton>
									</Flex>
								</Box>
							</Flex>
						)
					)}
				</Stack>
			)}
			{data && data.posts.hasMore ? (
				<Flex>
					<Button
						onClick={() => {
							setVariables({
								limit: variables.limit,
								cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
							});
						}}
						isLoading={fetching}
						m='auto'
						my={8}
					>
						Load more
					</Button>
				</Flex>
			) : null}
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
