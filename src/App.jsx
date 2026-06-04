/**
 * App.jsx
 * Root application component — sets up Router + Context Provider + Routes.
 * Also renders global UI: loading overlay and toast notifications.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import HomeScreen from './pages/HomeScreen';
import NewTreeWizard from './pages/NewTreeWizard';
import TreeCanvas from './pages/TreeCanvas';
import ApiLoadingOverlay from './components/ApiLoadingOverlay';
import ToastContainer from './components/ToastContainer';

function AppInner() {
  const { apiLoading } = useAppContext();
  return (
    <>
      {apiLoading && <ApiLoadingOverlay />}
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<HomeScreen />} />
          <Route path="/new-tree"   element={<NewTreeWizard />} />
          <Route path="/tree/:treeId" element={<TreeCanvas />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {/* Global toast notifications for API errors / warnings */}
      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
