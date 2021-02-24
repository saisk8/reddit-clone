import {
	FormControl,
	FormErrorMessage,
	FormLabel,
	Input,
	Textarea,
} from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react';

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
	name: string;
	label: string;
	textarea?: boolean;
};

export const InputField: React.FC<InputFieldProps> = ({
	label,
	size,
	textarea,
	...props
}) => {
	let C;
	if (textarea) {
		C = Textarea;
	} else {
		C = Input;
	}
	const [field, { error }] = useField(props);
	return (
		<FormControl isInvalid={!!error}>
			<FormLabel htmlFor={field.name}>{label}</FormLabel>
			<C {...field} {...props} id={field.name} />
			{error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
		</FormControl>
	);
};
export default InputField;
