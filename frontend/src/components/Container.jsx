import { useContext } from 'react';
import PropTypes from 'prop-types';

import { ThemeContext } from '../context/ThemeContext';

Container.propTypes = {
	children: PropTypes.node.isRequired,
};

export function Container({ children }) {
	const { theme } = useContext(ThemeContext);

	return (
		<div data-theme={theme} className="transition duration-300 ease-in-out min-h-svh max-h-fit">
			<div>{children}</div>
		</div>
	);
}
