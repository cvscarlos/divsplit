import { BrowserRouter, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/home';
import { GroupPage } from '../pages/group';
import GroupProvider from '../context/GroupContext';

const IndexRouter = () => {
	return (
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
	);
};

export default IndexRouter;
