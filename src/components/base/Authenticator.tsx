import { cloneElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import GetUser from '../../database/GetUser';

/**
 * Extend a component's props interface with this interface to add the user object.
 * All components passed to the <Authenticated /> component will have the user prop defined here.
 */
export interface AuthenticatedComponentDefaultProps {
  user?: User;
}

interface Props {
  component: React.ReactElement;
}

const Authenticator = ({ component }: Props) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const _user = await GetUser();
  
        if (!_user) {
          navigate('/login');
        } else {
          setUser(_user);
        }
      } catch (error) {
        console.error('Error authenticating user: ', error);
        navigate('/login');
      }
    })();
  }, [navigate, user]);

  return (
    <>
      { user && cloneElement(component, { user }) }
    </>
  );
}
 
export default Authenticator;