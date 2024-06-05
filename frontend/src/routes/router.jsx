import { Route, Routes } from 'react-router-dom';
import HomePage from '../pages/home/home';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const IndexRouter = () => {
    const { theme } = useContext(ThemeContext);
    return (
        <Routes>
            <Route path="/" element={<HomePage theme={theme} />} />
        </Routes>
    );
};

export default IndexRouter;
