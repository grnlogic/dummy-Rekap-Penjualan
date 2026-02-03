"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { CreateUserModal } from "../../components/CreateUserModal";
import {
  Users,
  Plus,
  Key,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface OnlineUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  lastActivity: string;
  lastLoginTime: string;
  sessionId: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user: currentUser } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      window.location.href = "/";
      return;
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();

    // Auto refresh online users setiap 30 detik
    const interval = setInterval(loadOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([loadUsers(), loadOnlineUsers()]);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${ENV.API_BASE_URL}/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch(
        `${ENV.API_BASE_URL}/user-activity/online-users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data);
        console.log("📊 Online users loaded:", data);
      } else {
        console.error(
          "Failed to load online users:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error loading online users:", error);
    }
  };

  // Helper function to check if user is online
  const isUserOnline = (userId: number) => {
    return onlineUsers.some((user) => user.id === userId);
  };

  const getOnlineUser = (userId: number) => {
    return onlineUsers.find((user) => user.id === userId);
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      const response = await fetch(
        `${ENV.API_BASE_URL}/users/${userId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        loadUsers(); // Reload data
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const resetPassword = async (userId: number) => {
    if (!confirm("Apakah Anda yakin ingin reset password user ini?")) return;

    try {
      const response = await fetch(
        `${ENV.API_BASE_URL}/users/${userId}/reset-password`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const newPassword = await response.text();
        alert(
          `Password berhasil direset!\nPassword baru: ${newPassword}\n\nCatat password ini dengan baik.`
        );
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Gagal reset password");
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;

    try {
      const response = await fetch(
        `${ENV.API_BASE_URL}/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        loadUsers(); // Reload data
        alert("User berhasil dihapus");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Gagal menghapus user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header dengan Online Status Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
          </div>

          {/* Online Status Summary */}
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 px-3 py-1 rounded-lg flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium text-sm">
                {onlineUsers.length} Online
              </span>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-lg flex items-center space-x-2">
              <UserX className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700 font-medium text-sm">
                {users.length - onlineUsers.length} Offline
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Online Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const onlineInfo = getOnlineUser(user.id);
              const isOnline = isUserOnline(user.id);

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                        user.active
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {user.active ? (
                        <>
                          <ToggleRight className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          isOnline ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {onlineInfo?.lastActivity
                      ? new Date(onlineInfo.lastActivity).toLocaleString(
                          "id-ID"
                        )
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => resetPassword(user.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                        title="Delete User"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada user yang terdaftar</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={loadUsers}
      />
    </div>
  );
}
