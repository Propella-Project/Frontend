/**
 * Profile Page
 * 
 * Allows authenticated users to view and edit their profile.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, Mail, Calendar, Edit2, Save, Loader2 } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { settingsApi } from "@/api/settings.api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user?.nickname || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("[Profile] Failed to update:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nickname: user?.nickname || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#18A0FB]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-gray-400">Manage your account information</p>
        </div>

        {/* Profile Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-[#1A1A1D] border-white/10">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#18A0FB] to-[#0B54A0] flex items-center justify-center text-3xl font-bold text-white">
                    {user.nickname?.charAt(0).toUpperCase() ||
                      user.username?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl font-bold text-white">
                    {user.nickname || user.username || "User"}
                  </h2>
                  <p className="text-gray-400">{user.email}</p>
                  {user.referral_code && (
                    <p className="text-sm text-gray-500 mt-1">
                      Referral Code: <span className="text-[#18A0FB]">{user.referral_code}</span>
                    </p>
                  )}
                </div>

                {/* Edit Button */}
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="border-white/10 hover:bg-white/5"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Form */}
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-[#1A1A1D] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Edit Profile</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-gray-300">
                    Nickname
                  </Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    placeholder="Choose a nickname"
                    className="bg-[#0F0F11] border-white/10 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#18A0FB] hover:bg-[#0B54A0]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={saving}
                    className="border-white/10 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Profile Details */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#1A1A1D] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F0F11]">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="text-white">{user.username || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F0F11]">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F0F11]">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="text-white">
                      {user.date_joined
                        ? new Date(user.date_joined).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                {user.referral_code && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F0F11]">
                    <UserCircle className="h-5 w-5 text-[#18A0FB]" />
                    <div>
                      <p className="text-sm text-gray-500">Referral Code</p>
                      <p className="text-[#18A0FB] font-medium">{user.referral_code}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#1A1A1D] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-[#0F0F11]">
                  <p className="text-2xl font-bold text-[#18A0FB]">
                    {user.total_referrals || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#0F0F11]">
                  <p className="text-2xl font-bold text-yellow-500">
                    {user.referral_points || 0}
                  </p>
                  <p className="text-sm text-gray-500">Referral Points</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#0F0F11]">
                  <p className="text-2xl font-bold text-green-500">
                    {user.is_verified ? "Yes" : "No"}
                  </p>
                  <p className="text-sm text-gray-500">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
