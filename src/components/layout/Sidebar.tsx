import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import SpellcheckOutlinedIcon from '@mui/icons-material/SpellcheckOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { AuthenticatedComponentDefaultProps } from '../base/Authenticator';
import '../../styles/app-layout.css';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Chat',
    path: '/chat',
    icon: <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  {
    label: 'Reading',
    path: '/reading',
    icon: <AutoStoriesOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  {
    label: 'Music',
    path: '/music',
    icon: <MusicNoteOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  {
    label: 'Vocab List',
    path: '/vocab',
    icon: <SpellcheckOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  {
    label: 'Saved Chats',
    path: '/chat/saved',
    icon: <BookmarkBorderOutlinedIcon sx={{ fontSize: 22 }} />,
  },
];

const Sidebar: React.FC<AuthenticatedComponentDefaultProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('robotica_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('robotica_sidebar_collapsed', String(next));
      return next;
    });
  };

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/chat') {
      return location.pathname === '/chat';
    }
    return location.pathname.startsWith(itemPath);
  };

  const handleMascotClick = () => {
    navigate('/chat');
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div>
        {/* Header with Mascot & Title */}
        <div
          className={`sidebar-header ${collapsed ? 'sidebar-header-collapsed' : ''}`}
          onClick={handleMascotClick}
          title="RoBotica Home"
        >
          <img
            src="/navily.png"
            alt="Navily"
            className="sidebar-mascot"
          />
          {!collapsed && (
            <span className="sidebar-brand-name">RoBotica</span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`sidebar-nav-section ${collapsed ? 'sidebar-nav-section-collapsed' : ''}`}>
          {navItems.map((item) => {
              const active = isItemActive(item.path);
              return (
                <Tooltip
                  key={item.path}
                  title={collapsed ? item.label : ''}
                  placement="right"
                  arrow
                  disableInteractive
                >
                  <div
                    className={`sidebar-item ${collapsed ? 'sidebar-item-collapsed' : ''} ${
                      active ? 'active' : ''
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    <div className="sidebar-icon">{item.icon}</div>
                    {!collapsed && <span className="sidebar-label">{item.label}</span>}
                  </div>
                </Tooltip>
              );
            })}
        </nav>
      </div>

      {/* Footer with Account, Logout & Collapse Toggle */}
      <div className={`sidebar-footer ${collapsed ? 'sidebar-footer-collapsed' : ''}`}>
        {/* Account */}
        <Tooltip
          title={collapsed ? 'Account' : ''}
          placement="right"
          arrow
          disableInteractive
        >
          <div
            className={`sidebar-item ${collapsed ? 'sidebar-item-collapsed' : ''} ${
              isItemActive('/account') ? 'active' : ''
            }`}
            onClick={() => navigate('/account')}
          >
            <div className="sidebar-icon">
              <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />
            </div>
            {!collapsed && <span className="sidebar-label">Account</span>}
          </div>
        </Tooltip>

        {/* Logout */}
        <Tooltip
          title={collapsed ? 'Logout' : ''}
          placement="right"
          arrow
          disableInteractive
        >
          <div
            className={`sidebar-item ${collapsed ? 'sidebar-item-collapsed' : ''}`}
            onClick={() => navigate('/logout')}
          >
            <div className="sidebar-icon">
              <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
            </div>
            {!collapsed && <span className="sidebar-label">Logout</span>}
          </div>
        </Tooltip>

        <div className="sidebar-divider" />

        {/* Collapse / Expand Button */}
        <Tooltip
          title={collapsed ? 'Expand sidebar' : ''}
          placement="right"
          arrow
          disableInteractive
        >
          <button
            type="button"
            className={`sidebar-toggle-btn ${collapsed ? 'sidebar-toggle-btn-collapsed' : ''}`}
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="sidebar-icon">
              {collapsed ? (
                <ChevronRightOutlinedIcon sx={{ fontSize: 20 }} />
              ) : (
                <ChevronLeftOutlinedIcon sx={{ fontSize: 20 }} />
              )}
            </div>
            {!collapsed && <span>Collapse</span>}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

export default Sidebar;
