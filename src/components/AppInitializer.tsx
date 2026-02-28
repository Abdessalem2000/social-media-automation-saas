import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getStoredToken } from '../config/api';
import { AppDispatch } from '../store';
import { verifyToken } from '../store/slices/authSlice';

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initializeApp = async () => {
      const token = getStoredToken();
      
      if (token) {
        try {
          // Verify token with backend
          await dispatch(verifyToken()).unwrap();
        } catch (error) {
          console.log('Token verification failed, user needs to login again');
        }
      }
    };

    initializeApp();
  }, [dispatch]);

  return <>{children}</>;
};

export default AppInitializer;
