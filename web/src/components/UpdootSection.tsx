import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React from 'react';
import { PostSnippetFragment } from '../generated/graphql';

interface UpdootSectionProps {
	post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
	return (
		<Flex direction='column' justifyContent='center' alignItems='center' mr={4}>
			<IconButton
				aria-label='Up doot'
				icon={<ChevronUpIcon w={8} h={8} />}
			></IconButton>
			{post.points}
			<IconButton
				aria-label='Dwon doot'
				icon={<ChevronDownIcon w={8} h={8} />}
			></IconButton>
		</Flex>
	);
};
export default UpdootSection;
