import { BrowserRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import HomePage from '../pages/HomePage';
import EventsPage from '../pages/EventsPage';
import Header from '../components/Header';
import { GroupPageWrapper } from '../components/GroupPageWrapper';
import { NotFound } from '../pages/NotFound';

// Inner app pages stay in a centered, padded column; the landing is full-bleed.
const Boxed = ({ children }: { children: ReactNode }) => (
	<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
);

const AppRouter = () => {
	return (
		<BrowserRouter>
			<Header />
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/events" element={<EventsPage />} />
				<Route
					path="/group/:groupId/:section/:sectionItem?"
					element={
						<Boxed>
							<GroupPageWrapper />
						</Boxed>
					}
				/>
				<Route
					path="*"
					element={
						<Boxed>
							<NotFound />
						</Boxed>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
};

export default AppRouter;
