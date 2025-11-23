
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Save, X, Loader2 } from "lucide-react";

interface ProfileFormControlsProps {
  isEditing: boolean;
  isSubmitting: boolean;
  onEditToggle: () => void;
}

const ProfileFormControls: React.FC<ProfileFormControlsProps> = ({ 
  isEditing, 
  isSubmitting, 
  onEditToggle 
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Personal Information</h3>
        <Button 
          type="button"
          variant="ghost" 
          size="icon" 
          onClick={onEditToggle}
          disabled={isSubmitting}
        >
          {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
        </Button>
      </div>
      
      {isEditing && (
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </>
          )}
        </Button>
      )}
    </>
  );
};

export default ProfileFormControls;
