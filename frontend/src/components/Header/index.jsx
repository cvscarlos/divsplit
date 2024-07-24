import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

function Header() {
	const { theme, toggleTheme } = useContext(ThemeContext);

	return (
		<header>
			<div className="navbar bg-base-100 transition duration-300 ease-in-out">
				<div className="flex-1">
					<Link to="/" className="btn btn-ghost text-xl">
						DivSplit
					</Link>
				</div>
				<div className="flex-none">
					<div className="flex justify-end p-5">
						<input
							type="checkbox"
							className="toggle"
							defaultChecked={theme === 'light' ? false : true}
							onClick={() => toggleTheme()}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;
