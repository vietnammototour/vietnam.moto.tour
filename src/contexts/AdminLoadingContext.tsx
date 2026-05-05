import {createContext, useContext, useState, type ReactNode} from 'react';

type AdminLoadingContextValue = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const AdminLoadingContext = createContext<AdminLoadingContextValue>({
  loading: false,
  setLoading: () => {},
});

export function AdminLoadingProvider({children}: {children: ReactNode}) {
  const [loading, setLoading] = useState(false);

  return (
    <AdminLoadingContext.Provider value={{loading, setLoading}}>
      {children}
    </AdminLoadingContext.Provider>
  );
}

export function useAdminLoading() {
  return useContext(AdminLoadingContext);
}
