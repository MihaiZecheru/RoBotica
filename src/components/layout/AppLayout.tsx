import React, { ReactElement } from 'react';
import Sidebar from './Sidebar';
import { AuthenticatedComponentDefaultProps } from '../base/Authenticator';
import '../../styles/app-layout.css';

interface AppLayoutProps extends AuthenticatedComponentDefaultProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ user, user_settings, children }) => {
  return (
    <div className="app-layout">
      <Sidebar user={user} user_settings={user_settings} />
      <main className="app-main-content">
        {React.isValidElement(children)
          ? React.cloneElement(children as ReactElement<AuthenticatedComponentDefaultProps>, {
              user,
              user_settings,
            })
          : children}
      </main>
    </div>
  );
};

export default AppLayout;
