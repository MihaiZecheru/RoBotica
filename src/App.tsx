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
import StoriesSearch from './components/StoriesSearch';
import StoryView from './components/StoryView';
import CreateStoryPage from './components/CreateStoryPage';
import MusicSearch from './components/MusicSearch';
import SongView from './components/SongView';
import CreateSongPage from './components/CreateSongPage';

function App() {
  return (
    <ModalProvider>
      <Router>
        <Routes>
          { /* Unrestricted access */ }
          <Route path="/" element={ <Landing /> } />
          <Route path="/login" element={ <LoginRegister /> } />
          <Route path="/logout" element={ <Logout /> } />
          <Route path="/navily" element={ <Navily /> } />

          { /* Restricted access - authentication required */ }
          <Route path="/chat" element={ <Authenticator component={ <ChatPage /> } /> } />
          <Route path="/chat/saved" element={ <Authenticator component={ <SavedChatsPage /> } /> } />
          <Route path="/account" element={ <Authenticator component={ <AccountPage /> } /> } />
          <Route path="/reading" element={ <Authenticator component={ <StoriesSearch /> } /> } />
          <Route path="/music" element={ <Authenticator component={ <MusicSearch /> } /> } />
          <Route path="/reading/:id" element={ <Authenticator component={ <StoryView /> } /> } />
          <Route path="/music/:id" element={ <Authenticator component={ <SongView /> } /> } />
          <Route path="/create-story" element={ <Authenticator component={ <CreateStoryPage /> } /> } />
          <Route path="/create-song" element={ <Authenticator component={ <CreateSongPage /> } /> } />
        </Routes>
      </Router>
    </ModalProvider>
  );
}

export default App;
