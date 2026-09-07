import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import Database from "../database/Database";
import { UserID } from "../database/ID";
import TLanguage, { LANGUAGES } from "../database/TLanguage";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import Dropdown from "./Dropdown";
import { useNavigate } from "react-router-dom";
import LanguageChangeModal from "./LanguageChangeModal";

const AccountPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<TLanguage>(user_settings?.language || 'Romanian');
  const [pendingLanguage, setPendingLanguage] = useState<TLanguage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user_settings?.language) {
      setSelectedLanguage(user_settings.language);
    }
  }, [user_settings?.language]);

  const handleLanguageChange = (new_value: string) => {
    const newLang = new_value as TLanguage;
    if (newLang === selectedLanguage) return;
    setPendingLanguage(newLang);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setPendingLanguage(null);
  };

  const handleModalConfirm = async () => {
    if (!pendingLanguage || !user_settings || !user) {
      setIsModalOpen(false);
      setPendingLanguage(null);
      return;
    }

    const nextLanguage = pendingLanguage;
    setIsModalOpen(false);
    setPendingLanguage(null);
    setSelectedLanguage(nextLanguage);

    user_settings.language = nextLanguage;
    window.sessionStorage.removeItem('songs'); // Clear the saved songs as they are in another language
    window.sessionStorage.removeItem('conversation_id');
    window.sessionStorage.removeItem('messages');

    try {
      await Database.UpdateUserSettings(user_settings, user.id as UserID);
      await Database.DeleteAllUserConversations(user.id as UserID);
    } catch (err) {
      console.error("Error updating language or wiping conversations:", err);
    }
  };

  const handleLevelChange = (new_value: string) => {
    // Update the user settings
    if (!user_settings || !user) return;
    user_settings.level = new_value as ('Beginner' | 'Intermediate');
    Database.UpdateUserSettings(user_settings, user.id as UserID);
  };

  const handleGenderChange = (new_value: string) => {
    // Update the user settings
    if (!user_settings || !user) return;
    user_settings.gender = new_value as ('Man' | 'Woman');
    Database.UpdateUserSettings(user_settings, user.id as UserID);
  };
  
  return (
    <div className="account-page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{user?.email}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Language</h3>
          <Dropdown
            options={LANGUAGES}
            handleChange={handleLanguageChange}
            _label="Set Language"
            starting_value={user_settings?.language || 'Romanian'}
            value={selectedLanguage}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Level</h3>
          <Dropdown
            options={['Beginner', 'Intermediate']}
            handleChange={handleLevelChange}
            _label="Set Level"
            starting_value={user_settings?.level || 'Beginner'}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0 }}>Gender</h3>
          <Dropdown
            options={['Man', 'Woman']}
            handleChange={handleGenderChange}
            _label="Set Gender"
            starting_value={user_settings?.gender || 'Man'}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" color="error" onClick={() => navigate('/logout')}>Logout</Button>
        </div>
      </div>
      <LanguageChangeModal
        isOpen={isModalOpen}
        targetLanguage={pendingLanguage}
        onCancel={handleModalCancel}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
 
export default AccountPage;