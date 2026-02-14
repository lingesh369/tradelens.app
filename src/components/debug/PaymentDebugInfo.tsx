import React from 'react';

interface PaymentDebugInfoProps {
  // searchParams is optional to prevent runtime crashes if not passed
  searchParams?: URLSearchParams;
  source: string | null;
  cashfreeOrderId: string | null;
  userId: string | null;
}

export const PaymentDebugInfo: React.FC<PaymentDebugInfoProps> = ({
  searchParams,
  source,
  cashfreeOrderId,
  userId
}) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Guard against undefined searchParams
  const allParams = Array.from((searchParams ?? new URLSearchParams()).entries());
  const sessionStorageData = {
    cashfree_order_id: sessionStorage.getItem('cashfree_order_id'),
    cashfree_payment_initiated: sessionStorage.getItem('cashfree_payment_initiated'),
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#1a1a1a',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      zIndex: 9999,
      border: '1px solid #333'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4ade80' }}>🐛 Payment Debug Info</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>URL Parameters:</strong>
        {allParams.length > 0 ? (
          <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
            {allParams.map(([key, value]) => (
              <li key={key}>
                <span style={{ color: '#60a5fa' }}>{key}</span>: {value || '<empty>'}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#ef4444' }}>No URL parameters found</div>
        )}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>SessionStorage:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
          {Object.entries(sessionStorageData).map(([key, value]) => (
            <li key={key}>
              <span style={{ color: '#60a5fa' }}>{key}</span>: {value || '<not set>'}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Extracted Values:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
          <li><span style={{ color: '#60a5fa' }}>source</span>: {source || '<null>'}</li>
          <li><span style={{ color: '#60a5fa' }}>cashfreeOrderId</span>: {cashfreeOrderId || '<null>'}</li>
          <li><span style={{ color: '#60a5fa' }}>userId</span>: {userId || '<null>'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong>
        <div style={{ 
          color: cashfreeOrderId ? '#4ade80' : '#ef4444',
          fontWeight: 'bold'
        }}>
          {cashfreeOrderId ? '✅ Order ID Found' : '❌ Order ID Missing'}
        </div>
      </div>

      <div style={{ fontSize: '10px', color: '#888', marginTop: '10px' }}>
        This debug info only appears in development mode
      </div>
    </div>
  );
};
