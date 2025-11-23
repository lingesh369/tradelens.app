import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, DollarSign, Tag, Globe, Clock } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useCommissions } from "@/hooks/useCommissions";
import { useTags } from "@/hooks/useTags";
import AccountDialog from "@/components/accounts/AccountDialog";
import { DeleteAccountDialog } from "@/components/accounts/DeleteAccountDialog";
import { CommissionDialog } from "@/components/commissions/CommissionDialog";
import { DeleteCommissionDialog } from "@/components/commissions/DeleteCommissionDialog";
import { TagDialog } from "@/components/tags/TagDialog";
import { DeleteTagDialog } from "@/components/tags/DeleteTagDialog";
import { GlobalSettingsForm } from "@/components/settings/GlobalSettingsForm";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("accounts");

  // Accounts
  const {
    accounts,
    isLoading: isAccountsLoading
  } = useAccounts();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Commissions
  const {
    commissions,
    isLoading: isCommissionsLoading
  } = useCommissions();
  const [isAddCommissionDialogOpen, setIsAddCommissionDialogOpen] = useState(false);
  const [isEditCommissionDialogOpen, setIsEditCommissionDialogOpen] = useState(false);
  const [isDeleteCommissionDialogOpen, setIsDeleteCommissionDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);

  // Tags
  const {
    tags,
    isLoading: isTagsLoading
  } = useTags();
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false);
  const [isEditTagDialogOpen, setIsEditTagDialogOpen] = useState(false);
  const [isDeleteTagDialogOpen, setIsDeleteTagDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);

  // Account handlers
  const handleAddAccount = () => {
    setSelectedAccount(null);
    setIsAddAccountDialogOpen(true);
  };
  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setIsEditAccountDialogOpen(true);
  };
  const handleDeleteAccount = (account: any) => {
    setSelectedAccount(account);
    setIsDeleteAccountDialogOpen(true);
  };

  // Commission handlers
  const handleAddCommission = () => {
    setSelectedCommission(null);
    setIsAddCommissionDialogOpen(true);
  };
  const handleEditCommission = (commission: any) => {
    setSelectedCommission(commission);
    setIsEditCommissionDialogOpen(true);
  };
  const handleDeleteCommission = (commission: any) => {
    setSelectedCommission(commission);
    setIsDeleteCommissionDialogOpen(true);
  };

  // Tag handlers
  const handleAddTag = () => {
    setSelectedTag(null);
    setIsAddTagDialogOpen(true);
  };
  const handleEditTag = (tag: any) => {
    setSelectedTag(tag);
    setIsEditTagDialogOpen(true);
  };
  const handleDeleteTag = (tag: any) => {
    setSelectedTag(tag);
    setIsDeleteTagDialogOpen(true);
  };

  return (
    <Layout title="Settings">
      <div className="p-4 sm:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Manage your trading accounts and preferences
              </p>
            </div>
          </div>

          {/* Mobile-optimized Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4 h-auto min-w-max">
                <TabsTrigger value="accounts" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4" /> 
                  <span className="hidden sm:inline">Accounts</span>
                  <span className="sm:hidden">Acc</span>
                </TabsTrigger>
                <TabsTrigger value="commissions" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4" /> 
                  <span className="hidden sm:inline">Commissions</span>
                  <span className="sm:hidden">Fees</span>
                </TabsTrigger>
                <TabsTrigger value="tags" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                  <Tag className="h-3 w-3 md:h-4 md:w-4" /> 
                  <span>Tags</span>
                </TabsTrigger>
                <TabsTrigger value="global" className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm">
                  <Globe className="h-3 w-3 md:h-4 md:w-4" /> 
                  <span className="hidden sm:inline">Global</span>
                  <span className="sm:hidden">Set</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="accounts" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-lg md:text-xl">Trading Accounts</CardTitle>
                    <CardDescription className="text-sm">Manage your trading accounts</CardDescription>
                  </div>
                  <Button className="flex items-center gap-2 w-full sm:w-auto text-sm" onClick={handleAddAccount}>
                    <PlusCircle className="h-4 w-4" /> Add Account
                  </Button>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Name</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Broker</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Starting Balance</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Current Balance</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[80px]">Type</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[80px]">Status</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isAccountsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">Loading accounts...</TableCell>
                          </TableRow>
                        ) : accounts.length > 0 ? (
                          accounts.map(account => (
                            <TableRow key={account.account_id}>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm font-medium">{account.account_name}</TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">{account.broker || "—"}</TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">${account.starting_balance.toLocaleString()}</TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">${account.current_balance.toLocaleString()}</TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${account.type === 'Live' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {account.type}
                                </span>
                              </TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${account.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {account.status}
                                </span>
                              </TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAccount(account)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteAccount(account)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <p>No accounts found.</p>
                                <Button onClick={handleAddAccount} size="sm">Add your first account!</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-lg md:text-xl">Commissions & Fees</CardTitle>
                    <CardDescription className="text-sm">Manage your commissions and fees for different accounts</CardDescription>
                  </div>
                  <Button className="flex items-center gap-2 w-full sm:w-auto text-sm" onClick={handleAddCommission}>
                    <PlusCircle className="h-4 w-4" /> Add Fee Structure
                  </Button>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Account</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Broker</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Market Type</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[100px]">Commission</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[100px]">Fees</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[100px]">Total Fees</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isCommissionsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">Loading fee structures...</TableCell>
                          </TableRow>
                        ) : commissions.length > 0 ? (
                          commissions.map(commission => {
                            const accountName = commission.account_id ? accounts.find(a => a.account_id === commission.account_id)?.account_name || "Unknown Account" : "All Accounts";
                            return (
                              <TableRow key={commission.commission_id}>
                                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm font-medium">{accountName}</TableCell>
                                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">{commission.broker || "—"}</TableCell>
                                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">
                                  <span className="rounded-full bg-slate-100 font-normal text-xs px-3 py-1 text-black">
                                    {commission.market_type}
                                  </span>
                                </TableCell>
                                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">${commission.commission.toFixed(2)}</TableCell>
                                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">${commission.fees.toFixed(2)}</TableCell>
                                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">${commission.total_fees.toFixed(2)}</TableCell>
                                <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">
                                  <div className="flex space-x-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCommission(commission)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCommission(commission)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <p>No fee structures found.</p>
                                <Button onClick={handleAddCommission} size="sm">Add your first fee structure!</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-lg md:text-xl">Tags</CardTitle>
                    <CardDescription className="text-sm">Create and manage tags for your trades</CardDescription>
                  </div>
                  <Button className="flex items-center gap-2 w-full sm:w-auto text-sm" onClick={handleAddTag}>
                    <PlusCircle className="h-4 w-4" /> Add Tag
                  </Button>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[120px]">Name</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[100px]">Type</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[200px]">Description</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-semibold text-muted-foreground text-xs sm:text-sm min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isTagsLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">Loading tags...</TableCell>
                          </TableRow>
                        ) : tags.length > 0 ? (
                          tags.map(tag => (
                            <TableRow key={tag.tag_id}>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm font-medium">{tag.tag_name}</TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${tag.tag_type === 'Mistake' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {tag.tag_type}
                                </span>
                              </TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">{tag.description || "—"}</TableCell>
                              <TableCell className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm">
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTag(tag)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTag(tag)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <p>No tags found.</p>
                                <Button onClick={handleAddTag} size="sm">Add your first tag!</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="global" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Global Settings</CardTitle>
                  <CardDescription className="text-sm">Manage your application preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <GlobalSettingsForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <AccountDialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen} account={null} />
        <AccountDialog open={isEditAccountDialogOpen} onOpenChange={setIsEditAccountDialogOpen} account={selectedAccount} />
        <DeleteAccountDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen} account={selectedAccount} />
        <CommissionDialog open={isAddCommissionDialogOpen} onOpenChange={setIsAddCommissionDialogOpen} commission={null} />
        <CommissionDialog open={isEditCommissionDialogOpen} onOpenChange={setIsEditCommissionDialogOpen} commission={selectedCommission} />
        <DeleteCommissionDialog open={isDeleteCommissionDialogOpen} onOpenChange={setIsDeleteCommissionDialogOpen} commission={selectedCommission} />
        <TagDialog open={isAddTagDialogOpen} onOpenChange={setIsAddTagDialogOpen} tag={null} />
        <TagDialog open={isEditTagDialogOpen} onOpenChange={setIsEditTagDialogOpen} tag={selectedTag} />
        <DeleteTagDialog open={isDeleteTagDialogOpen} onOpenChange={setIsDeleteTagDialogOpen} tag={selectedTag} />
      </div>
    </Layout>
  );
};

export default Settings;
