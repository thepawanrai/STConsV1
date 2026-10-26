import React, { createContext, useContext, useEffect, useState } from 'react';

export type RoutePath =
  | '/'
  | '/about'
  | '/projects'
  | '/projects/narayani-villas'
  | '/construction-updates'
  | '/contact'
  | '/privacy-policy'
  | '/terms-disclaimer';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  openEnquiryModal: (defaultTopic?: string) => void;
  closeEnquiryModal: () => void;
  isEnquiryModalOpen: boolean;
  enquiryModalTopic?: string;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      return path;
    }
    return '/';
  });

  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryModalTopic, setEnquiryModalTopic] = useState<string | undefined>('Project Details');

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      setCurrentPath(path);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEnquiryModal = (defaultTopic: string = 'Project Details') => {
    setEnquiryModalTopic(defaultTopic);
    setIsEnquiryModalOpen(true);
  };

  const closeEnquiryModal = () => {
    setIsEnquiryModalOpen(false);
  };

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        navigate,
        openEnquiryModal,
        closeEnquiryModal,
        isEnquiryModalOpen,
        enquiryModalTopic
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
