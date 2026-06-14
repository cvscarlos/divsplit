import { BrowserRouter, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import Header from '../components/Header';
import { GroupPageWrapper } from '../components/GroupPageWrapper';
import { NotFound } from '../pages/NotFound';

const AppRouter = () => {
	return (
		<BrowserRouter>
			<Header />
			<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/group/:groupId/:section/:sectionItem?" element={<GroupPageWrapper />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>
		</BrowserRouter>
	);
};

export default AppRouter;
