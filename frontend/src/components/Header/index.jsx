import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

function Header() {
	const { theme, toggleTheme } = useContext(ThemeContext);

	return (
		<header className="w-full h-1/2">
			<div className="flex justify-end p-5">
				<input
					type="checkbox"
					className="toggle"
					defaultChecked={theme === 'light' ? false : true}
					onClick={() => toggleTheme()}
				/>
			</div>
		</header>
	);
}

export default Header;
