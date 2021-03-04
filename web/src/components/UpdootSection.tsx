import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React, { useState } from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

interface UpdootSectionProps {
	post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
	const [, vote] = useVoteMutation();
	const [loadingState, setLoadingState] = useState<
		'updoot-loading' | 'downdoot-loading' | 'not-loading'
	>('not-loading');
	return (
		<Flex direction='column' justifyContent='center' alignItems='center' mr={4}>
			<IconButton
				onClick={async () => {
					setLoadingState('updoot-loading');
					await vote({
						postId: post.id,
						value: 1,
					});
					setLoadingState('not-loading');
				}}
				aria-label='Up doot'
				icon={<ChevronUpIcon w={8} h={8} />}
				isLoading={loadingState === 'updoot-loading'}
			></IconButton>
			{post.points}
			<IconButton
				onClick={async () => {
					setLoadingState('downdoot-loading');
					await vote({
						postId: post.id,
						value: -1,
					});
					setLoadingState('not-loading');
				}}
				aria-label='Dwon doot'
				icon={<ChevronDownIcon w={8} h={8} />}
				isLoading={loadingState === 'downdoot-loading'}
			></IconButton>
		</Flex>
	);
};
export default UpdootSection;
