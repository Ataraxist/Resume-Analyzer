import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';

import Splash from './Pages/Splash';
import Dashboard from './Pages/Dashboard/Dashboard';
import Login from './Pages/Login';
import './global.css';

const App = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path='/' element={<Splash />} />
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/login' element={<Login />} />
            </Routes>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
