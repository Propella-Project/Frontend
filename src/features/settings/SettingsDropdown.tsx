import { useState, useEffect } from "react";
import { useUserStore } from "@/state/user.store";
import { useSettings } from "@/hooks/useSettings";
import { useNotificationStore, type Notification } from "@/state/notification.store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  User,
  Bell,
  Volume2,
  VolumeX,
  Check,
  LogOut,
  ChevronRight,
  Sparkles,
  Gift,
  RefreshCw,
  X,
} from "lucide-react";
import { ReferralPanel } from "@/components/referrals/ReferralPanel";
import { toast } from "sonner";
import { AI_TUTORS } from "@/utils/constants";
import { getRelativeTime } from "@/utils/time";
import { resetAppToOnboarding } from "@/utils/resetApp";

export function SettingsDropdown() {
  const { nickname, ai_tutor_selected, ai_voice_enabled, clearUser } =
    useUserStore();
  const { updateProfile, loading } = useSettings();
  const { notifications, unreadCount, markAsRead, removeNotification } = useNotificationStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [newNickname, setNewNickname] = useState(nickname);
  const [selectedTutor, setSelectedTutor] = useState(ai_tutor_selected);
  const [voiceEnabled, setVoiceEnabled] = useState(ai_voice_enabled);

  // Load persisted AI Tutor selection
  useEffect(() => {
    const savedTutor = localStorage.getItem("aiTutor");
    if (savedTutor) {
      setSelectedTutor(savedTutor);
    }
  }, []);

  // Generate or retrieve referral code
  useEffect(() => {
    const state = useUserStore.getState();

    if (!state.referralCode && nickname) {
      // Check localStorage first
      const storedCode = localStorage.getItem("referralCode");

      if (storedCode) {
        state.setReferralCode(storedCode);
      } else {
        // Generate new code from nickname (first 3 chars + random 3 digits)
        const prefix = nickname.slice(0, 3).toUpperCase();
        const randomNum = Math.floor(100 + Math.random() * 900);
        const newCode = `${prefix}${randomNum}`;

        // Store in localStorage and state
        localStorage.setItem("referralCode", newCode);
        state.setReferralCode(newCode);
      }
    }
  }, [nickname]);

  const handleUpdateProfile = async () => {
    const success = await updateProfile({
      nickname: newNickname,
      ai_tutor_selected: selectedTutor,
      ai_voice_enabled: voiceEnabled,
    });

    if (success) {
      // Update localStorage to persist changes
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        nickname: newNickname,
        ai_tutor_selected: selectedTutor,
        ai_voice_enabled: voiceEnabled,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Persist AI Tutor selection separately
      localStorage.setItem("aiTutor", selectedTutor);

      toast.success("Profile updated successfully!");
      setIsProfileOpen(false);
    }
  };

  const handleLogout = () => {
    // Clear authentication tokens
    localStorage.removeItem("propella_token");
    localStorage.removeItem("propella_refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("referralCode");
    localStorage.removeItem("aiTutor");

    // Clear user state
    clearUser();

    toast.success("Logged out successfully");

    // Redirect to login page on main domain
    window.location.href = "https://propella.ng/login";
  };

  const getNotificationIcon = (
    type: "roadmap" | "task" | "streak" | "general",
    isRead: boolean,
  ) => {
    if (!isRead) {
      // Red alert for unread notifications
      return <div className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />;
    }
    switch (type) {
      case "roadmap":
        return <Sparkles className="w-4 h-4 text-[#CCFF00]" />;
      case "task":
        return <Check className="w-4 h-4 text-[#3B82F6]" />;
      case "streak":
        return <Sparkles className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#9CA3AF]" />;
    }
  };

  const handleRemoveNotification = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    removeNotification(notification.id);
    toast.success("Notification removed");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-[#1A1A1E] hover:bg-[#2A2A2E] text-[#9CA3AF] hover:text-white relative"
          >
            <Settings className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 bg-[#1A1A1E] border-[#2A2A2E]"
        >
          <DropdownMenuLabel className="text-[#9CA3AF]">
            Settings
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#2A2A2E]" />

          {/* Profile Edit */}
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-[#2A2A2E]"
                onSelect={(e) => e.preventDefault()}
              >
                <User className="w-4 h-4 mr-2" />
                Profile Edit
                <ChevronRight className="w-4 h-4 ml-auto" />
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1A1E] border-[#2A2A2E] text-white">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription className="text-[#9CA3AF]">
                  Update your profile settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Nickname */}
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="bg-[#0F0F11] border-[#2A2A2E]"
                  />
                </div>

                {/* AI Tutor Selection */}
                <div className="space-y-2">
                  <Label>AI Tutor</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-[#0F0F11] border-[#2A2A2E]"
                      >
                        <span className="flex items-center gap-2">
                          {
                            AI_TUTORS.find((t) => t.name === selectedTutor)
                              ?.avatar
                          }
                          {selectedTutor}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-[#1A1A1E] border-[#2A2A2E]">
                      <DropdownMenuRadioGroup
                        value={selectedTutor}
                        onValueChange={setSelectedTutor}
                      >
                        {AI_TUTORS.map((tutor) => (
                          <DropdownMenuRadioItem
                            key={tutor.id}
                            value={tutor.name}
                            className="focus:bg-[#2A2A2E]"
                          >
                            <span className="mr-2">{tutor.avatar}</span>
                            {tutor.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Voice Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {voiceEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#CCFF00]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#9CA3AF]" />
                    )}
                    <Label htmlFor="voice">AI Voice</Label>
                  </div>
                  <Switch
                    id="voice"
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                  />
                </div>
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full bg-[#6D28D9] hover:bg-[#5B21B6]"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogContent>
          </Dialog>

          {/* Notifications */}
          <Dialog
            open={isNotificationsOpen}
            onOpenChange={setIsNotificationsOpen}
          >
            <DialogTrigger asChild>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-[#2A2A2E]"
                onSelect={(e) => e.preventDefault()}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadCount}
                  </Badge>
                )}
                <ChevronRight className="w-4 h-4 ml-2" />
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1A1E] border-[#2A2A2E] text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Notifications</DialogTitle>
                <DialogDescription className="text-[#9CA3AF]">
                  Stay updated with your learning progress
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-[#9CA3AF]">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors group relative ${
                          notification.isRead
                            ? "bg-[#0F0F11] border-[#2A2A2E]"
                            : "bg-[#2A2A2E] border-[#3A3A3E]"
                        }`}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        {/* Remove button - only show for read notifications */}
                        {notification.isRead && (
                          <button
                            onClick={(e) => handleRemoveNotification(e, notification)}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[#2A2A2E] hover:bg-[#EF4444]/20 text-[#9CA3AF] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove notification"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type, notification.isRead)}
                          <div className="flex-1 pr-4">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-white' : ''}`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-[#9CA3AF]">
                                {getRelativeTime(
                                  new Date(notification.timestamp),
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-[#9CA3AF] mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Referral Program */}
          <DropdownMenuItem
            className="cursor-pointer focus:bg-[#2A2A2E]"
            onSelect={(e) => e.preventDefault()}
            onClick={() => setIsReferralOpen(true)}
          >
            <Gift className="w-4 h-4 mr-2 text-[#CCFF00]" />
            Referral Program
            <ChevronRight className="w-4 h-4 ml-auto" />
          </DropdownMenuItem>

          {/* Restart Onboarding */}
          <DropdownMenuItem
            className="cursor-pointer focus:bg-[#2A2A2E]"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to restart onboarding? This will reset all your progress.",
                )
              ) {
                resetAppToOnboarding();
              }
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2 text-[#F59E0B]" />
            Restart Onboarding
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#2A2A2E]" />

          {/* Logout */}
          <DropdownMenuItem
            className="cursor-pointer text-[#EF4444] focus:text-[#EF4444] focus:bg-[#2A2A2E]"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Referral Program Panel */}
      <ReferralPanel
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
      />
    </>
  );
}
