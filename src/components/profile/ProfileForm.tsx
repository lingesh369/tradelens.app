import React, { useState, useEffect } from 'react';
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/user-profile";
import { supabase } from "@/integrations/supabase/client";

import ProfileFormFields, { profileFormSchema, type ProfileFormValues } from './ProfileFormFields';
import ProfileFormControls from './ProfileFormControls';
import ProfileFormSkeleton from './ProfileFormSkeleton';

interface ProfileFormProps {
  userData: ProfileFormValues;
  setUserData: (data: ProfileFormValues) => void;
  isLoading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ userData, setUserData, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEmailChangeRequested, setIsEmailChangeRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: userData
  });

  // Reset form values when userData changes (e.g., on initial load)
  useEffect(() => {
    if (userData) {
      form.reset(userData);
    }
  }, [userData, form]);

  const handleEditToggle = () => {
    if (isEditing) {
      form.reset(userData);
    }
    setIsEditing(!isEditing);
    setIsEmailChangeRequested(false);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      const emailChanged = values.email !== userData.email;
      
      if (emailChanged) {
        setIsEmailChangeRequested(true);
        
        const { error: emailError } = await supabase.auth.updateUser({ email: values.email });
        
        if (emailError) {
          console.error("Error updating email:", emailError);
          toast({
            title: "Email Update Failed",
            description: emailError.message,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        toast({
          title: "Verification Email Sent",
          description: "Please check your new email address for a verification link",
        });
        
        // Keep existing email in local state until verified
        values.email = userData.email;
      }

      // Map form field names to database column names
      const dbUpdates = {
        first_name: values.firstName,
        last_name: values.lastName,
        username: values.username,
      };
      
      // Use user.id which is the auth_id in Supabase
      const { error: updateError, success } = await updateUserProfile(
        user.id,
        dbUpdates
      );

      if (updateError || !success) {
        console.error("Error updating user data:", updateError);
        toast({
          title: "Update Failed",
          description: "Could not update your profile information",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Update local state with new values
      setUserData({
        ...userData,
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
      });

      toast({
        title: "Profile Updated",
        description: emailChanged 
          ? "Your profile has been updated. Email change requires verification."
          : "Your profile has been updated successfully",
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error("Unexpected error updating profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <ProfileFormSkeleton />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ProfileFormControls 
              isEditing={isEditing} 
              isSubmitting={isSubmitting} 
              onEditToggle={handleEditToggle} 
            />
            
            <ProfileFormFields 
              form={form}
              isEditing={isEditing}
              isEmailChangeRequested={isEmailChangeRequested}
            />
          </form>
        </Form>
      )}
    </div>
  );
};

export default ProfileForm;
