import {Routes, Route} from "react-router-dom";
import ClientRegisterPage from "./login.html";
import ClientLoginPage from "./index.html";
import ClientDashboardPage from "./dashboard.html";

function App() {
    return (
        <Routes>
            <Route path="/client/register" element={<ClientRegisterPage/>}/>
            <Route path="/client/login" element={<ClientLoginPage/>}/>
            <Route path="/client/dashboard" element={<ClientDashboardPage/>}/>
        </Routes>
    );
}

export default App;