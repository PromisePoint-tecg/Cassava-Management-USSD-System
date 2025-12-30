import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminApp from "./AdminApp";
import StaffApp from "./StaffApp";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Admin routes - default */}
        <Route path="/*" element={<AdminApp />} />

        {/* Staff routes - under /staff */}
        <Route path="/staff/*" element={<StaffApp />} />
      </Routes>
    </Router>
  );
};

export default App;
