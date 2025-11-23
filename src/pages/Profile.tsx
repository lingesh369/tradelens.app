
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileDetails from "@/components/profile/ProfileDetails";
import ProfileSecurity from "@/components/profile/ProfileSecurity";
import SubscriptionInfo from "@/components/profile/SubscriptionInfo";
import BillingHistory from "@/components/profile/BillingHistory";
import { User, Shield, CreditCard, FileText } from "lucide-react";

const Profile = () => {
  return (
    <Layout title="Profile">
      <div className="p-2 sm:p-4 md:p-6 max-w-full overflow-hidden">
        <div className="space-y-4 md:space-y-6 w-full">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Mobile-optimized Tabs */}
          <Tabs defaultValue="profile-details" className="space-y-4 md:space-y-6 w-full">
            <div className="w-full overflow-hidden">
              <div className="border-b">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                  <TabsTrigger value="profile-details" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                    <User className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                    <Shield className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Security</span>
                    <span className="sm:hidden">Sec</span>
                  </TabsTrigger>
                  <TabsTrigger value="subscription" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                    <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Subscription</span>
                    <span className="sm:hidden">Sub</span>
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                    <FileText className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Billing</span>
                    <span className="sm:hidden">Bill</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <TabsContent value="profile-details" className="space-y-4 md:space-y-6 w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <ProfileDetails />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 md:space-y-6 w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <ProfileSecurity />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="subscription" className="space-y-4 md:space-y-6 w-full">
              <div className="space-y-4 w-full">
                <SubscriptionInfo />
              </div>
            </TabsContent>
            
            <TabsContent value="billing" className="space-y-4 md:space-y-6 w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Billing History</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 overflow-hidden">
                  <BillingHistory />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
