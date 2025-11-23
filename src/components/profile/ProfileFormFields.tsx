
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

// Define the schema to match the main form
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormFieldsProps {
  form: UseFormReturn<ProfileFormValues>;
  isEditing: boolean;
  isEmailChangeRequested: boolean;
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({ 
  form, 
  isEditing, 
  isEmailChangeRequested 
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  readOnly={!isEditing} 
                  className={!isEditing ? "bg-background" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  readOnly={!isEditing} 
                  className={!isEditing ? "bg-background" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                readOnly={!isEditing} 
                className={!isEditing ? "bg-background" : ""}
              />
            </FormControl>
            {isEmailChangeRequested && (
              <p className="text-xs text-amber-500">
                Verification email sent. Please check your new email inbox.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                readOnly={!isEditing} 
                className={!isEditing ? "bg-background" : ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export { profileFormSchema, type ProfileFormValues };
export default ProfileFormFields;
