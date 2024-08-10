import { BrowserRouter, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import { GroupPage } from '../pages/GroupPage';
import GroupProvider from '../context/GroupContext';
import Header from '../components/Header';

const AppRouter = () => {
	return (
		<BrowserRouter>
			<Header />
			<div className="container">
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
			</div>
		</BrowserRouter>
	);
};

export default AppRouter;
