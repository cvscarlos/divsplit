import { useContext } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import { GroupPage } from '../pages/GroupPage';
import GroupProvider from '../context/GroupContext';
import { ThemeContext } from '../context/ThemeContext';

const IndexRouter = () => {
	const { theme } = useContext(ThemeContext);

	return (
		<div data-theme={theme}>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route
						path="/group/:groupId"
						element={
							<GroupProvider>
								<GroupPage />
							</GroupProvider>
						}
					/>
				</Routes>
			</BrowserRouter>
		</div>
	);
};

export default IndexRouter;
