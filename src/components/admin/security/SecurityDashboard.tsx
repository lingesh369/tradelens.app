
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleAuditLogs } from './RoleAuditLogs';
import { Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const securityFeatures = [
    {
      name: 'Role Escalation Prevention',
      status: 'Active',
      description: 'Users cannot modify their own roles',
      icon: Shield,
      color: 'text-green-600'
    },
    {
      name: 'Audit Logging',
      status: 'Active', 
      description: 'All role changes are logged with IP tracking',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      name: 'Secure Functions',
      status: 'Active',
      description: 'Database functions use proper search_path settings',
      icon: Lock,
      color: 'text-green-600'
    },
    {
      name: 'Admin Validation',
      status: 'Active',
      description: 'Server-side validation for all admin operations',
      icon: AlertTriangle,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
        <p className="text-muted-foreground">Monitor and manage system security features</p>
      </div>

      {/* Security Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {securityFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {feature.name}
                </CardTitle>
                <Icon className={`h-4 w-4 ${feature.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {feature.status}
                </div>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
          <CardDescription>
            Additional security measures to consider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Enable Leaked Password Protection</p>
                <p className="text-sm text-muted-foreground">
                  Go to Supabase Auth settings to enable protection against compromised passwords
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Regular Security Audits</p>
                <p className="text-sm text-muted-foreground">
                  Review role audit logs regularly for suspicious activity
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <Lock className="h-4 w-4 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Multi-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Consider enabling MFA for admin users for additional security
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Audit Logs */}
      <RoleAuditLogs />
    </div>
  );
};
