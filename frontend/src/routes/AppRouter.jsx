import { BrowserRouter, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import Header from '../components/Header';
import { GroupPageWrapper } from '../components/GroupPageWrapper';

const AppRouter = () => {
	return (
		<BrowserRouter>
			<Header />
			<div className="container">
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/group/:groupId/:section" element={<GroupPageWrapper />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
};

export default AppRouter;
