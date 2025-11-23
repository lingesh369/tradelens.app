
import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EnhancedNotificationForm } from '@/components/admin/notifications/EnhancedNotificationForm';
import { NotificationHistory } from '@/components/admin/notifications/NotificationHistory';
import { PushNotificationTest } from '@/components/admin/notifications/PushNotificationTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, History, TestTube } from 'lucide-react';

const AdminNotifications = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Enhanced Notification Center</h1>
          <p className="text-muted-foreground">
            Send targeted notifications to user segments with scheduling and multi-channel delivery.
          </p>
        </div>

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Notification
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History & Scheduled
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test Push
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <EnhancedNotificationForm />
          </TabsContent>

          <TabsContent value="history">
            <NotificationHistory />
          </TabsContent>

          <TabsContent value="test">
            <div className="flex justify-center">
              <PushNotificationTest />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
