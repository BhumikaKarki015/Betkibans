import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from "./Login";
import Register from "./Register";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </Router>
    );
}

export default App;