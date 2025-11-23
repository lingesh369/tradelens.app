
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface User {
  user_id: string;
  username: string;
  email: string;
  user_status: string;
}

interface UserSelectorProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUsers,
  onSelectionChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers([]);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Update selected user details when selection changes
  useEffect(() => {
    const details = users.filter(user => selectedUsers.includes(user.user_id));
    setSelectedUserDetails(details);
  }, [selectedUsers, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('user_id, username, email, user_status')
        .eq('user_status', 'Active')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching users',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.includes(user.user_id)) {
      onSelectionChange([...selectedUsers, user.user_id]);
    }
    setSearchTerm('');
  };

  const handleUserRemove = (userId: string) => {
    onSelectionChange(selectedUsers.filter(id => id !== userId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Select Target Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Label htmlFor="user-search">Search Users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="user-search"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {searchTerm && filteredUsers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Users */}
        {selectedUserDetails.length > 0 && (
          <div>
            <Label>Selected Users ({selectedUserDetails.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedUserDetails.map((user) => (
                <Badge key={user.user_id} variant="secondary" className="flex items-center gap-1">
                  {user.username}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleUserRemove(user.user_id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange([])}
            disabled={selectedUsers.length === 0}
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
