import PropTypes from 'prop-types';

import { useThemeContext } from '../context/ThemeContext';

Container.propTypes = {
	children: PropTypes.node.isRequired,
};

export function Container({ children }) {
	const { theme } = useThemeContext();

	return (
		<div data-theme={theme} className="transition duration-300 ease-in-out min-h-svh">
			{children}
		</div>
	);
}
