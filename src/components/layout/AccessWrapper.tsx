
import React from 'react';
import { PlanAccessWrapper } from './PlanAccessWrapper';

interface AccessWrapperProps {
  children: React.ReactNode;
}

export const AccessWrapper: React.FC<AccessWrapperProps> = ({ children }) => {
  return (
    <PlanAccessWrapper>
      {children}
    </PlanAccessWrapper>
  );
};
