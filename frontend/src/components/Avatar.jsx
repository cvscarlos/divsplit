import PropTypes from 'prop-types';

Avatar.propTypes = {
	name: PropTypes.node.isRequired,
};

const backgroundColors = 'ccffb2,feff9e,aaebf9,f5c1ff';
const avatarColor = 'ffe554,f498bf,6accd9,ed4a9b,6d4399,73b06f,0c8f8f,405059';
const size = '64';

const url = new URL('https://api.dicebear.com/9.x/thumbs/svg');
url.searchParams.set('backgroundColor', backgroundColors);
url.searchParams.set('shapeColor', avatarColor);
url.searchParams.set('radius', '50');
url.searchParams.set('shapeOffsetX', '5');
url.searchParams.set('size', size);

const baseUrl = url.toString();

export function Avatar({ name }) {
	const url = new URL(baseUrl);
	url.searchParams.set('seed', name);
	return <img src={url} alt={`Avatar: ${name}`} width={size / 2} height={size / 2} className="not-prose" />;
}
