import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Authenticator from './components/base/Authenticator';
import ChatPage from './components/ChatPage';
import LoginRegister from './components/base/LoginRegister';
import Landing from './components/base/Landing';
import Logout from './components/base/Logout';
import { ModalProvider } from './components/base/useInfoModal';
import AccountPage from './components/AccountPage';
import Navily from './components/Navily';
import SavedChatsPage from './components/SavedChatsPage';
import ReadingPage from './components/Reading';

function App() {
  return (
    <ModalProvider>
      <Router>
        <Routes>
          { /* Unrestricted access */ }
          <Route path="/" element={ <Authenticator component={ <Landing /> } /> } />
          <Route path="/login" element={ <LoginRegister /> } />
          <Route path="/logout" element={ <Logout /> } />
          <Route path="/navily" element={ <Navily /> } />

          { /* Restricted access - authentication required */ }
          {/* TODO: do language properly */}
          <Route path="/chat" element={ <Authenticator component={ <ChatPage language="Romanian" /> } /> } />
          <Route path="/chat/saved" element={ <Authenticator component={ <SavedChatsPage /> } /> } />
          <Route path="/account" element={ <Authenticator component={ <AccountPage /> } /> } />
          <Route path="/reading" element={ <Authenticator component={ <ReadingPage language="Romanian" /> } /> } />
        </Routes>
      </Router>
    </ModalProvider>
  );
}

export default App;
