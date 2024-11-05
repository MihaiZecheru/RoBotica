import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Authenticator from './components/base/Authenticator';
import Home from './components/base/Home';
import LoginRegister from './components/base/LoginRegister';
import Landing from './components/base/Landing';
import Logout from './components/base/Logout';
import { ModalProvider } from './components/base/useInfoModal';
import SavedConversationsPage from './components/SavedConversationsPage';
import AccountPage from './components/AccountPage';

function App() {
  return (
    <ModalProvider>
      <Router>
        <Routes>
          { /* Unrestricted access */ }
          <Route path="/" element={ <Authenticator component={ <Landing /> } /> } />
          <Route path="/login" element={ <LoginRegister /> } />
          <Route path="/logout" element={ <Logout /> } />

          { /* Restricted access - authentication required */ }
          <Route path="/chat" element={ <Authenticator component={ <Home /> } /> } />
          <Route path="/chat/saved" element={ <Authenticator component={ <SavedConversationsPage /> } /> } />
          <Route path="/account" element={ <Authenticator component={ <AccountPage /> } /> } />
        </Routes>
      </Router>
    </ModalProvider>
  );
}

export default App;
