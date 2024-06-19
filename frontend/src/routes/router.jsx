import { Route, Routes } from 'react-router-dom';

import HomePage from '../pages/home';
import { GroupPage } from '../pages/group';

const IndexRouter = () => {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/group/:id" element={<GroupPage />} />
		</Routes>
	);
};

export default IndexRouter;
