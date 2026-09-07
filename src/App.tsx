import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Authenticator from './components/base/Authenticator';
import ChatPage from './components/ChatPage';
import LoginRegister from './components/base/LoginRegister';
import Landing from './components/base/Landing';
import Logout from './components/base/Logout';
import { ModalProvider } from './components/base/useInfoModal';
import AccountPage from './components/AccountPage';
import SavedChatsPage from './components/SavedChatsPage';
import StoriesSearch from './components/StoriesSearch';
import StoryView from './components/StoryView';
import MusicSearch from './components/MusicSearch';
import SongView from './components/SongView';
import VocabListPage from './components/VocabListPage';
import VocabQuizPage from './components/VocabQuizPage';

import AppLayout from './components/layout/AppLayout';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ component }: { component: React.ReactElement }) => (
  <Authenticator component={<AppLayout>{component}</AppLayout>} />
);

function App() {
  return (
    <ModalProvider>
      <Router>
        <Routes>
          { /* Unrestricted access */ }
          <Route path="/" element={ <Landing /> } />
          <Route path="/login" element={ <LoginRegister /> } />
          <Route path="/logout" element={ <Logout /> } />
          <Route path="/navily" element={ <Navigate to="/chat" replace /> } />

          { /* Restricted access - authentication required */ }
          <Route path="/chat" element={ <ProtectedRoute component={ <ChatPage /> } /> } />
          <Route path="/chat/saved" element={ <ProtectedRoute component={ <SavedChatsPage /> } /> } />
          <Route path="/account" element={ <ProtectedRoute component={ <AccountPage /> } /> } />
          <Route path="/reading" element={ <ProtectedRoute component={ <StoriesSearch /> } /> } />
          <Route path="/music" element={ <ProtectedRoute component={ <MusicSearch /> } /> } />
          <Route path="/reading/:id" element={ <ProtectedRoute component={ <StoryView /> } /> } />
          <Route path="/music/:id" element={ <ProtectedRoute component={ <SongView /> } /> } />
          <Route path="/vocab" element={ <ProtectedRoute component={ <VocabListPage /> } /> } />
          <Route path="/vocab/quiz" element={ <ProtectedRoute component={ <VocabQuizPage /> } /> } />
        </Routes>
      </Router>
    </ModalProvider>
  );
}

export default App;
