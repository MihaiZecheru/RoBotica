import { Button } from "@mui/material";
import Database from "../database/Database";
import { UserID } from "../database/ID";
import TLanguage, { LANGUAGES } from "../database/TLanguage";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import Dropdown from "./Dropdown";
import { useNavigate } from "react-router-dom";

const AccountPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();

  const handleLanguageChange = (new_value: string) => {
    // Update the user settings
    if (!user_settings || !user) return;
    user_settings.language = new_value as TLanguage;
    window.sessionStorage.removeItem('songs'); // Clear the saved songs as they are in another language
    Database.UpdateUserSettings(user_settings, user.id as UserID);
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
    <div className="account-page">
      <center><h3>{user?.email}</h3></center>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100vw', marginBottom: '1rem' }}>
        <h3 style={{ marginLeft: '1rem' }}>Language</h3>
        <Dropdown
          options={LANGUAGES}
          handleChange={handleLanguageChange}
          _label="Set Language"
          starting_value={user_settings?.language || 'Romanian'}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100vw', marginBottom: '1rem' }}>
        <h3 style={{ marginLeft: '1rem' }}>Level</h3>
        <Dropdown
          options={['Beginner', 'Intermediate']}
          handleChange={handleLevelChange}
          _label="Set Level"
          starting_value={user_settings?.level || 'Beginner'}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100vw' }}>
        <h3 style={{ marginLeft: '1rem' }}>Gender</h3>
        <Dropdown
          options={['Man', 'Woman']}
          handleChange={handleGenderChange}
          _label="Set Gender"
          starting_value={user_settings?.gender || 'Man'}
        />
      </div>
      <Button type='button' onClick={() => {
          navigate('/logout');
        }} sx={{ position: 'fixed', bottom: '1rem', left: '1rem' }}>Logout</Button>
      <Button type='button' onClick={() => {
          navigate('/navily');
        }} sx={{ position: 'fixed', bottom: '1rem', right: '1rem' }}>Navily</Button>
    </div>
  );
}
 
export default AccountPage;