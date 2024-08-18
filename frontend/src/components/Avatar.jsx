import PropTypes from 'prop-types';

Avatar.propTypes = {
	name: PropTypes.node.isRequired,
};

export function Avatar({ name }) {
	return (
		<img
			src="https://api.dicebear.com/9.x/thumbs/svg?seed=Lilly&backgroundColor=A77CBF,F57A9C,F99F66,FFD758,A6D472,31B5D1&shapeColor=6209D4,08C6CD,FECD70,5E0792,E136A7,FF9F6F&radius=50&size=64"
			alt={`Avatar: ${name}`}
			width={50}
			height={50}
		/>
	);
}
