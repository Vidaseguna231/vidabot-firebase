
import React from 'react';
import { BotIcon, AdminShieldIcon, PowerUserIcon, SignOutIcon } from './Icons';

interface HeaderProps {
  isAdmin: boolean;
  isPowerUser: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, isPowerUser, onSignIn, onSignOut }) => {
  return (
    <header className="bg-vida-bg-light/80 backdrop-blur-sm p-4 border-b border-vida-border fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center">
          <BotIcon className="w-8 h-8 text-vida-blue mr-3" />
          <div>
            <h1 className="text-xl font-bold text-vida-text-primary">Vida IR-GuideBot</h1>
            <p className="text-xs text-vida-text-secondary -mt-1">Founded by Vida</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {isAdmin && (
                <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                    <AdminShieldIcon className="w-5 h-5"/>
                    <span className="hidden sm:inline">Admin Mode</span>
                </div>
            )}
            {isPowerUser && !isAdmin && (
                 <div className="flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm font-semibold">
                    <PowerUserIcon className="w-5 h-5"/>
                    <span className="hidden sm:inline">Power User</span>
                </div>
            )}
            {isPowerUser ? (
                <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-vida-text-secondary bg-vida-bg-light border border-vida-border rounded-lg hover:bg-vida-border hover:text-vida-text-primary transition-colors">
                    <SignOutIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            ) : (
                <button onClick={onSignIn} className="px-4 py-1 text-sm font-semibold text-vida-text-primary bg-vida-blue rounded-lg hover:bg-opacity-90 transition-colors">
                    Sign In
                </button>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;