import { cloneElement, useEffect, useState, ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import GetUser, { GetUserSettings, TUserSettings } from '../../database/GetUser';
import { UserID } from '../../database/ID';

/**
 * Extend a component's props interface with this interface to add the user object.
 * All components passed to the <Authenticated /> component will have the user prop defined here.
 */
export interface AuthenticatedComponentDefaultProps {
  user?: User;
  user_settings?: TUserSettings;
}

interface Props {
  component: ReactElement;
}

const Authenticator = ({ component }: Props) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [user_settings, setUserSettings] = useState<TUserSettings | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const _user = await GetUser();
        
        if (!_user) {
          navigate('/login');
        } else {
          const _user_settings = await GetUserSettings(_user.id as UserID);
          setUser(_user);
          setUserSettings(_user_settings);
        }
      } catch (error) {
        console.error('Error authenticating user: ', error);
        navigate('/login');
      }
    })();
  }, [navigate]);

  return (
    <>
      { user && user_settings && cloneElement(component, { user, user_settings }) }
    </>
  );
}
 
export default Authenticator;