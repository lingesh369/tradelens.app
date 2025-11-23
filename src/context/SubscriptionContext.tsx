
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Define subscription feature keys for type safety
export type SubscriptionFeatureKey = 
  | "notes"
  | "analytics_overview" 
  | "analytics_other"
  | "profile";

// Type for the subscription context
export type SubscriptionContextProps = {
  planName: string;
  plan: string;
  isExpired: boolean;
  isTrialExpired: boolean;
  daysLeft: number;
  canAccessFeature: (featureKey: SubscriptionFeatureKey) => Promise<boolean>;
  checkResourceLimit: (resourceType: string) => Promise<number>;
  showUpgradeModal: (feature?: string) => void;
  upgradeModalProps: {
    isOpen: boolean;
    featureName: string | undefined;
    onClose: () => void;
    onUpgrade: () => void;
  };
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextProps | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [planName, setPlanName] = useState<string>('Free Trial');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(undefined);
  
  // Function to fetch user subscription details
  const fetchSubscription = async () => {
    if (!user) {
      setPlanName('Not Logged In');
      setIsExpired(true);
      setDaysLeft(0);
      return;
    }
    
    try {
      // Use the get_user_access_matrix function to get subscription status
      const { data: accessData, error: accessError } = await supabase.rpc('get_user_access_matrix', {
        auth_user_id: user.id
      });
      
      if (accessError) {
        console.error('Error fetching subscription:', accessError);
        // Fallback for errors
        setPlanName('Free Trial');
        setDaysLeft(7);
        setIsExpired(false);
        return;
      }
      
      // Handle both array response (TABLE) and direct object response (JSONB)
      const userData = Array.isArray(accessData) ? (accessData.length > 0 ? accessData[0] : null) : accessData;
      
      if (userData) {
        const planName = userData.planName || 'Free Trial';
        setPlanName(planName);
        
        // Check if subscription is active
        const isActive = Boolean(userData.isActive);
        setIsExpired(!isActive);
        
        // Calculate days left if we have an end date
        if (userData.endDate) {
          const endDate = new Date(userData.endDate);
          const now = new Date();
          const daysPassed = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysLeftInSub = Math.max(0, -daysPassed);
          setDaysLeft(daysLeftInSub);
        } else {
          // If no end_date is set, use default values
          setDaysLeft(planName === 'Free Trial' ? 7 : 30);
        }
      } else {
        // Fallback for new users
        setPlanName('Free Trial');
        setDaysLeft(7);
        setIsExpired(false);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Fallback for new users
      setPlanName('Free Trial');
      setDaysLeft(7);
      setIsExpired(false);
    }
  };
  
  useEffect(() => {
    fetchSubscription();
  }, [user]);
  
  // Feature access check function
  const canAccessFeature = async (featureKey: SubscriptionFeatureKey): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('get_user_access_matrix', {
        auth_user_id: user.id
      });
      
      if (error) {
        console.error(`Error checking access to ${featureKey}:`, error);
        return false;
      }
      
      // Handle both array response (TABLE) and direct object response (JSONB)
      const accessData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
      
      if (accessData) {
        // First check if subscription is active and not blocked
        if (!accessData.isActive || accessData.accessBlocked) {
          return false;
        }
        
        switch (featureKey) {
          case 'notes':
            return accessData.notesAccess || false;
          case 'profile':
            return accessData.profileAccess || false;
          case 'analytics_overview':
            return accessData.analyticsAccess || false;
          case 'analytics_other':
            return accessData.analyticsAccess || false;
          default:
            return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking access to ${featureKey}:`, error);
      return false;
    }
  };
  
  // Resource limit check function
  const checkResourceLimit = async (resourceType: string): Promise<number> => {
    if (!user) return 0;
    
    try {
      // Use the centralized get_user_access_matrix function
      const { data: accessData, error: accessError } = await supabase
        .rpc('get_user_access_matrix', { auth_user_id: user.id });
      
      // Handle both array response (TABLE) and direct object response (JSONB)
      const userAccess = Array.isArray(accessData) ? 
        (accessData.length > 0 ? accessData[0] : null) : accessData;
      
      if (accessError || !userAccess) {
        console.log(`No access data found for ${resourceType}, using Free Trial defaults`);
        // Return Free Trial defaults
        switch (resourceType) {
          case 'accounts':
            return 1;
          case 'strategies':
            return 3;
          default:
            return 0;
        }
      }
      
      // Check if subscription is active
      if (!userAccess.isActive || userAccess.accessBlocked) {
        // Return Free Trial defaults if subscription is not active
        switch (resourceType) {
          case 'accounts':
            return 1;
          case 'strategies':
            return 3;
          default:
            return 0;
        }
      }
      
      // Check if this is a Pro plan (unlimited resources)
      const isPro = (userAccess.planName || '').toLowerCase().includes('pro');
      if (isPro) {
        return -1; // -1 means unlimited
      }
      
      switch (resourceType) {
        case 'accounts':
          return userAccess.accountsLimit || 1;
        case 'strategies':
          return userAccess.strategiesLimit || 3;
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error checking limit for ${resourceType}:`, error);
      // Return Free Trial defaults on error
      switch (resourceType) {
        case 'accounts':
          return 1;
        case 'strategies':
          return 3;
        default:
          return 0;
      }
    }
  };
  
  // Show upgrade modal
  const showUpgradeModal = (feature?: string) => {
    setUpgradeFeature(feature);
    setUpgradeModalOpen(true);
  };
  
  // Hide upgrade modal
  const hideUpgradeModal = () => {
    setUpgradeModalOpen(false);
  };
  
  // Handle upgrade click
  const handleUpgrade = () => {
    window.location.href = "/subscription";
    hideUpgradeModal();
  };

  const contextValue: SubscriptionContextProps = {
    planName,
    plan: planName.toLowerCase().replace(/\s+/g, '_'),
    isExpired,
    isTrialExpired: planName === 'Free Trial' && isExpired,
    daysLeft,
    canAccessFeature,
    checkResourceLimit,
    showUpgradeModal,
    upgradeModalProps: {
      isOpen: upgradeModalOpen,
      featureName: upgradeFeature,
      onClose: hideUpgradeModal,
      onUpgrade: handleUpgrade
    },
    refreshSubscription: fetchSubscription
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook to use the subscription context
export const useSubscriptionContext = (): SubscriptionContextProps => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
  }
  return context;
};
