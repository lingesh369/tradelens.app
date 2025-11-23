
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminSecurityService } from '@/services/adminSecurityService';
import { format } from 'date-fns';
import { Shield, Clock, User, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const RoleAuditLogs: React.FC = () => {
  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['roleAuditLogs'],
    queryFn: AdminSecurityService.getRoleAuditLogs,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin': return 'destructive';
      case 'Manager': return 'default';
      case 'User': return 'secondary';
      default: return 'outline';
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-destructive">Failed to load audit logs</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Change Audit Logs
        </CardTitle>
        <CardDescription>
          Complete history of all role changes in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !auditLogs?.length ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No role changes recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role Change</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(log.changed_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-mono">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {log.user_id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.old_role && (
                          <Badge variant={getRoleBadgeVariant(log.old_role)} className="text-xs">
                            {log.old_role}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">→</span>
                        <Badge variant={getRoleBadgeVariant(log.new_role)} className="text-xs">
                          {log.new_role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {log.changed_by?.slice(0, 8) || 'System'}...
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.reason ? (
                        <div className="flex items-start gap-2 max-w-[200px]">
                          <FileText className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                          <span className="text-sm text-muted-foreground truncate" title={log.reason}>
                            {log.reason}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No reason provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-muted-foreground">
                        {log.ip_address || 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
