
import React, { useState, useEffect, useMemo } from 'react';
import { storage } from './firebase';
import { api } from './api';
import type { User, Post, Group, Story, Course, Notice, Conversation, College, PersonalNote, UserTag, GroupCategory, GroupPrivacy, AttendanceRecord, Note, Assignment, DepartmentChat } from './types';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import { logout } from './utils/authUtils';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AcademicsPage from './pages/AcademicsPage';
import CourseDetailPage from './pages/CourseDetailPage';
import PersonalNotesPage from './pages/PersonalNotesPage';
import NoticeBoardPage from './pages/NoticeBoardPage';
import HodPage from './pages/HodPage';
import DirectorPage from './pages/DirectorPage';
import SuperAdminPage from './pages/SuperAdminPage';
import SearchPage from './pages/SearchPage';
import ConfessionsPage from './pages/ConfessionsPage';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  // Data State
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departmentChats, setDepartmentChats] = useState<DepartmentChat[]>([]);

  const checkHealth = async () => {
    try {
      const data = await api.get('/health');
      setBackendStatus(data.database === 'connected' ? 'connected' : 'disconnected');
    } catch (err) {
      setBackendStatus('disconnected');
    }
  };

  // 0. Fetch Data from MongoDB (Periodic Polling)
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
        const token = currentUser.token;
        const collegeId = currentUser.collegeId || '';

        try {
            const data = await api.get('/auth/users', token);
            const usersData: { [key: string]: User } = { [currentUser.id]: currentUser };
            data.forEach((u: any) => {
                usersData[u._id] = { ...u, id: u._id, avatarUrl: u.profilePicture || u.avatarUrl };
            });
            setUsers(usersData);
        } catch (err) {
            console.error("Failed to fetch users", err);
            // Ensure currentUser is always in users map even if fetch fails
            setUsers(prev => ({ ...prev, [currentUser.id]: currentUser }));
        }

        try {
            const data = await api.get('/groups', token);
            setGroups(data.map((g: any) => ({ ...g, id: g._id })));
        } catch (err) {
            console.error("Failed to fetch groups", err);
        }

        try {
            const data = await api.get(`/stories?collegeId=${collegeId}`, token);
            setStories(data.map((s: any) => ({ ...s, id: s._id })));
        } catch (err) {
            console.error("Failed to fetch stories", err);
        }

        try {
            const data = await api.get(`/courses?collegeId=${collegeId}`, token);
            setCourses(data.map((c: any) => ({ ...c, id: c._id })));
        } catch (err) {
            console.error("Failed to fetch courses", err);
        }

        try {
            const data = await api.get(`/notices?collegeId=${collegeId}`, token);
            setNotices(data.map((n: any) => ({ ...n, id: n._id })));
        } catch (err) {
            console.error("Failed to fetch notices", err);
        }

        try {
            const data = await api.get('/conversations', token);
            setConversations(data.map((c: any) => ({ ...c, id: c._id })));
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        }

        try {
            const data = await api.get('/colleges', token);
            setColleges(data.map((c: any) => ({ ...c, id: c._id })));
        } catch (err) {
            console.error("Failed to fetch colleges", err);
        }

        try {
            // If Director, fetch all department chats for their college
            // If HOD, fetch only their department's chats
            const deptFilter = currentUser.tag === 'Director' ? '' : `&department=${currentUser.department}`;
            const data = await api.get(`/department-chats?collegeId=${collegeId}${deptFilter}`, token);
            setDepartmentChats(data.map((c: any) => ({ ...c, id: c._id })));
        } catch (err) {
            console.error("Failed to fetch department chats", err);
        }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Backend Health Check
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for storage events (for backend session synchronization)
  useEffect(() => {
      const handleStorageChange = () => {
          const storedUserString = localStorage.getItem('user');
          if (storedUserString) {
              try {
                  const storedUser = JSON.parse(storedUserString);
                  setCurrentUser(storedUser);
              } catch (e) {
                  console.error("Failed to parse stored user", e);
              }
          } else {
              setCurrentUser(null);
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync browser hash with currentPath state
  useEffect(() => {
      const handleHashChange = () => {
          const hash = window.location.hash;
          if (hash && hash !== currentPath) {
              setCurrentPath(hash);
          }
      };
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPath]);

  // Update hash when state changes
  useEffect(() => {
      if (window.location.hash !== currentPath) {
          window.location.hash = currentPath;
      }
  }, [currentPath]);

  // Role-Based Redirection Enforcer
  useEffect(() => {
      if (!currentUser) return;

      const publicPaths = ['#/', '#/login', '#/signup'];
      const isPublicPath = publicPaths.includes(currentPath);

      // Note: We allow HOD/Director/Admin to visit #/home if they explicitly navigate there.
      // We only force redirect if they are on a "logged out" public path (like landing page).

      if (currentUser.tag === 'Super Admin') {
          if (isPublicPath) setCurrentPath('#/superadmin');
      } else if (currentUser.tag === 'Director') {
          if (isPublicPath) setCurrentPath('#/director');
      } else if (currentUser.tag === 'HOD/Dean') {
          if (isPublicPath) setCurrentPath('#/hod');
      } else {
          // Regular Users (Student/Teacher)
          if (isPublicPath) setCurrentPath('#/home');
      }
  }, [currentUser, currentPath]);

  // 1. Session Initialization (MongoDB Backend)
  useEffect(() => {
    const initSession = async () => {
        const storedUserString = localStorage.getItem('user');
        if (storedUserString) {
            try {
                const storedUser = JSON.parse(storedUserString);
                if (storedUser.token) {
                    // Fetch fresh profile from MongoDB to ensure token and data are valid
                    try {
                        const userData = await api.get('/auth/me', storedUser.token);
                        const user = { ...userData, id: userData._id, token: storedUser.token };
                        setCurrentUser(user);
                        setUsers(prev => ({ ...prev, [user.id]: user }));
                    } catch (err) {
                        console.error("Session verification failed", err);
                        // If token is invalid/expired, clear session
                        localStorage.removeItem('user');
                        setCurrentUser(null);
                    }
                }
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }
        }
        setLoading(false);
    };

    initSession();
  }, []);

  // Fetch Posts from MongoDB
  useEffect(() => {
    if (!currentUser) return;

    const fetchPosts = async () => {
        try {
            const data = await api.get(`/posts?collegeId=${currentUser.collegeId || ''}`, currentUser.token);
            setPosts(data.map((p: any) => ({ ...p, id: p._id })));
        } catch (err) {
            console.error("Failed to fetch posts from MongoDB", err);
        }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, [currentUser]);

  // Utility to convert dataURL to Blob for robust Firebase uploads
  const dataURLtoBlob = (dataurl: string) => {
      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
  };

  // Posts Handlers (MongoDB Backend)
  const handleAddPost = async (postDetails: any) => {
      if (!currentUser) return;
      try {
          // Normalize mediaDataUrls to mediaUrls for backend compatibility if present
          const { mediaDataUrls, ...rest } = postDetails;
          const uploadedUrls: string[] = [];

          if (mediaDataUrls && mediaDataUrls.length > 0) {
              if (!storage) {
                  throw new Error("Cloud storage is unavailable. Please check your configuration.");
              }
              for (let i = 0; i < mediaDataUrls.length; i++) {
                  try {
                      const dataUrl = mediaDataUrls[i];
                      const blob = dataURLtoBlob(dataUrl);
                      const fileRef = storage.ref().child(`posts/${currentUser.id}/${Date.now()}_${i}`);
                      const snapshot = await fileRef.put(blob);
                      const url = await snapshot.ref.getDownloadURL();
                      uploadedUrls.push(url);
                  } catch (uploadErr) {
                      console.error(`Failed to upload media item ${i}:`, uploadErr);
                      throw new Error("One or more images failed to upload. Please try again.");
                  }
              }
          }

          const payload = {
              ...rest,
              mediaUrls: uploadedUrls,
              collegeId: currentUser.collegeId || ''
          };

          const newPost = await api.post('/posts', payload, currentUser.token);
          setPosts(prev => [{ ...newPost, id: newPost._id }, ...prev]);
          return newPost;
      } catch (err: any) {
          console.error("Failed to add post:", err);
          throw err; // Rethrow to allow UI (CreatePost) to handle/alert
      }
  };

  const handleDeletePost = async (postId: string) => {
      if (!currentUser) return;
      try {
          await api.delete(`/posts/${postId}`, currentUser.token);
          setPosts(prev => prev.filter(p => p.id !== postId));
      } catch (err: any) {
          console.error("Failed to delete post", err);
      }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
      if (!currentUser) return;
      try {
          const updatedReactions = await api.post(`/posts/${postId}/react`, { reactionType }, currentUser.token);
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: updatedReactions } : p));
      } catch (err: any) {
          console.error("Failed to update reaction", err);
      }
  };

  const handleAddComment = async (postId: string, text: string) => {
      if (!currentUser) return;
      try {
          const updatedComments = await api.post(`/posts/${postId}/comment`, { text }, currentUser.token);
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
      } catch (err: any) {
          console.error("Failed to add comment", err);
      }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
      if (!currentUser) return;
      try {
          const updatedComments = await api.delete(`/posts/${postId}/comment/${commentId}`, currentUser.token);
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
      } catch (err: any) {
          console.error("Failed to delete comment", err);
      }
  };

  const handleToggleSavePost = async (postId: string) => {
      if (!currentUser) return;
      const isSaved = currentUser.savedPosts?.includes(postId);
      const newSavedPosts = isSaved
          ? currentUser.savedPosts?.filter(id => id !== postId)
          : [...(currentUser.savedPosts || []), postId];

      try {
          const updatedUser = await api.put('/auth/profile', { savedPosts: newSavedPosts }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, savedPosts: updatedUser.savedPosts } : null);
      } catch (err: any) {
          console.error("Failed to toggle save post", err);
      }
  };

  const handleSharePost = async (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group', id?: string }) => {
      if (!currentUser) return;

      const authorIdToSave = typeof originalPost.authorId === 'object'
        ? (originalPost.authorId as any)._id || (originalPost.authorId as any).id
        : originalPost.authorId;

      const sharedPostInfo = {
          originalId: originalPost.id,
          originalAuthorId: authorIdToSave,
          originalTimestamp: originalPost.timestamp,
          originalContent: originalPost.content,
          originalMediaUrls: originalPost.mediaUrls,
          originalMediaType: originalPost.mediaType,
          originalIsEvent: originalPost.isEvent,
          originalEventDetails: originalPost.eventDetails,
          originalIsConfession: originalPost.isConfession
      };

      try {
          const newPost = await api.post('/posts', {
              content: commentary,
              sharedPost: sharedPostInfo,
              groupId: shareTarget.type === 'group' ? shareTarget.id : undefined,
              collegeId: currentUser.collegeId
          }, currentUser.token);
          setPosts(prev => [{ ...newPost, id: newPost._id }, ...prev]);
      } catch (err: any) {
          console.error("Failed to share post", err);
      }
  };

  const handleSharePostAsMessage = async (conversationId: string, authorName: string, postContent: string) => {
      if (!currentUser) return;
      const text = `Shared post by ${authorName}: ${postContent.substring(0, 50)}...`;
      await handleSendMessage(conversationId, text);
  };

  // Stories
  const handleAddStory = async (storyDetails: any) => {
      if (!currentUser) return;
      try {
          const { mediaDataUrl, ...rest } = storyDetails;
          let mediaUrl = undefined;

          if (mediaDataUrl) {
              if (!storage) throw new Error("Cloud storage is unavailable.");
              const blob = dataURLtoBlob(mediaDataUrl);
              const fileRef = storage.ref().child(`stories/${currentUser.id}/${Date.now()}`);
              const snapshot = await fileRef.put(blob);
              mediaUrl = await snapshot.ref.getDownloadURL();
          }

          const newStory = await api.post('/stories', {
              ...rest,
              mediaUrl,
              collegeId: currentUser.collegeId
          }, currentUser.token);
          setStories(prev => [{ ...newStory, id: newStory._id }, ...prev]);
      } catch (err: any) {
          console.error("Failed to add story:", err);
          throw err;
      }
  };

  const handleMarkStoryAsViewed = async (storyId: string) => {
      if (!currentUser) return;
      try {
          const viewedBy = await api.post(`/stories/${storyId}/view`, {}, currentUser.token);
          setStories(prev => prev.map(s => s.id === storyId ? { ...s, viewedBy } : s));
      } catch (err: any) {
          console.error("Failed to mark story as viewed", err);
      }
  };

  const handleDeleteStory = async (storyId: string) => {
      if (!currentUser) return;
      try {
          await api.delete(`/stories/${storyId}`, currentUser.token);
          setStories(prev => prev.filter(s => s.id !== storyId));
      } catch (err: any) {
          console.error("Failed to delete story", err);
      }
  };

  const handleReplyToStory = async (authorId: string, text: string) => {
      const conversationId = await handleCreateOrOpenConversation(authorId);
      await handleSendMessage(conversationId, text);
  };

  // Chat
  const handleCreateOrOpenConversation = async (otherUserId: string): Promise<string> => {
      if (!currentUser) throw new Error("Not logged in");
      try {
          const conversation = await api.post('/conversations', { otherUserId }, currentUser.token);
          setConversations(prev => {
              const exists = prev.find(c => c.id === conversation._id);
              if (exists) return prev;
              return [...prev, { ...conversation, id: conversation._id }];
          });
          return conversation._id;
      } catch (err: any) {
          throw err;
      }
  };

  const handleSendMessage = async (conversationId: string, text: string, mediaDataUrl?: string, mediaType?: 'image' | 'video') => {
      if (!currentUser) return;
      try {
          let mediaUrl = undefined;
          if (mediaDataUrl) {
              if (!storage) throw new Error("Cloud storage is unavailable.");
              const blob = dataURLtoBlob(mediaDataUrl);
              const fileRef = storage.ref().child(`chats/${conversationId}/${Date.now()}`);
              const snapshot = await fileRef.put(blob);
              mediaUrl = await snapshot.ref.getDownloadURL();
          }

          const newMessage = await api.post(`/conversations/${conversationId}/messages`, { text, mediaUrl, mediaType }, currentUser.token);
          setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: [...c.messages, newMessage] } : c));
      } catch (err: any) {
          console.error("Failed to send message:", err);
          throw err;
      }
  };

  const handleDeleteMessagesForEveryone = async (conversationId: string, messageIds: string[]) => {
      if (!currentUser) return;
      try {
          const updatedMessages = await api.delete(`/conversations/${conversationId}/messages`, currentUser.token, { messageIds });
          setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: updatedMessages } : c));
      } catch (err: any) {
          console.error("Failed to delete messages for everyone", err);
      }
  };

  const handleDeleteMessagesForSelf = async (conversationId: string, messageIds: string[]) => {
      if (!currentUser) return;
      try {
          const updatedMessages = await api.delete(`/conversations/${conversationId}/messages/self`, currentUser.token, { messageIds });
          setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: updatedMessages } : c));
      } catch (err: any) {
          console.error("Failed to delete messages for self", err);
      }
  };

  const handleDeleteConversations = async (conversationIds: string[]) => {
      if (!currentUser) return;
      try {
          await api.delete('/conversations', currentUser.token, { conversationIds });
          setConversations(prev => prev.filter(c => !conversationIds.includes(c.id)));
      } catch (err: any) {
          console.error("Failed to delete conversations", err);
      }
  };

  // Groups (MongoDB Backend)
  const handleCreateGroup = async (groupDetails: any) => {
      if (!currentUser) return;
      if (!currentUser.token) {
          console.warn("Attempting to create group without backend token. Fallback to localStorage will be used.");
      }
      try {
          const newGroup = await api.post('/groups', {
              ...groupDetails,
              collegeId: currentUser.collegeId
          }, currentUser.token);
          setGroups(prev => [...prev, { ...newGroup, id: newGroup._id }]);
      } catch (err: any) {
          alert("Failed to create group: " + err.message);
      }
  };

  const handleJoinGroupRequest = async (groupId: string) => {
      if (!currentUser) return;
      try {
          const updatedGroup = await api.post(`/groups/${groupId}/join`, {}, currentUser.token);
          setGroups(prev => prev.map(g => g.id === groupId ? { ...updatedGroup, id: updatedGroup._id } : g));
      } catch (err: any) {
          alert("Failed to join group: " + err.message);
      }
  };

  const handleApproveJoinRequest = async (groupId: string, userId: string) => {
      if (!currentUser) return;
      try {
          const updatedGroup = await api.post(`/groups/${groupId}/approve/${userId}`, {}, currentUser.token);
          setGroups(prev => prev.map(g => g.id === groupId ? { ...updatedGroup, id: updatedGroup._id } : g));
      } catch (err: any) {
          alert("Failed to approve request: " + err.message);
      }
  };

  const handleDeclineJoinRequest = async (groupId: string, userId: string) => {
      if (!currentUser) return;
      try {
          const updatedGroup = await api.post(`/groups/${groupId}/decline/${userId}`, {}, currentUser.token);
          setGroups(prev => prev.map(g => g.id === groupId ? { ...updatedGroup, id: updatedGroup._id } : g));
      } catch (err: any) {
          alert("Failed to decline request: " + err.message);
      }
  };

  const handleToggleFollowGroup = async (groupId: string) => {
      if (!currentUser) return;
      const isFollowing = currentUser.followingGroups?.includes(groupId);
      const newFollowingGroups = isFollowing
          ? currentUser.followingGroups?.filter(id => id !== groupId)
          : [...(currentUser.followingGroups || []), groupId];

      try {
          // The backend /groups/:id/follow already handles the logic and returns status
          // We update the User profile in MongoDB too
          const updatedUser = await api.put('/auth/profile', { followingGroups: newFollowingGroups }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, followingGroups: updatedUser.followingGroups } : null);

          // Also notify group followers (optional, as polling will handle it, but for immediate feedback)
          await api.post(`/groups/${groupId}/follow`, {}, currentUser.token);
      } catch (err: any) {
          console.error("Failed to toggle follow", err);
      }
  };

  const handleUpdateGroup = async (groupId: string, data: any) => {
      if (!currentUser) return;
      try {
          const updatedGroup = await api.put(`/groups/${groupId}`, data, currentUser.token);
          setGroups(prev => prev.map(g => g.id === groupId ? { ...updatedGroup, id: updatedGroup._id } : g));
      } catch (err: any) {
          alert("Failed to update group: " + err.message);
      }
  };

  const handleDeleteGroup = async (groupId: string) => {
      if (!currentUser) return;
      try {
          await api.delete(`/groups/${groupId}`, currentUser.token);
          setGroups(prev => prev.filter(g => g.id !== groupId));
      } catch (err: any) {
          alert("Failed to delete group: " + err.message);
      }
  };

  const handleSendGroupMessage = async (groupId: string, text: string, mediaDataUrl?: string, mediaType?: 'image' | 'video') => {
      if (!currentUser) return;
      try {
          let mediaUrl = undefined;
          if (mediaDataUrl) {
              if (!storage) throw new Error("Cloud storage is unavailable.");
              const blob = dataURLtoBlob(mediaDataUrl);
              const fileRef = storage.ref().child(`groups/${groupId}/chats/${Date.now()}`);
              const snapshot = await fileRef.put(blob);
              mediaUrl = await snapshot.ref.getDownloadURL();
          }

          const messages = await api.post(`/groups/${groupId}/messages`, { text, mediaUrl, mediaType }, currentUser.token);
          setGroups(prev => prev.map(g => g.id === groupId ? { ...g, messages } : g));
      } catch (err: any) {
          console.error("Failed to send group message:", err);
          throw err;
      }
  };

  const handleRemoveGroupMember = async (groupId: string, memberId: string) => {
      if (!currentUser) return;
      try {
          const updatedGroup = await api.delete(`/groups/${groupId}/members/${memberId}`, currentUser.token);
          setGroups(prev => prev.map(g => g.id === groupId ? { ...updatedGroup, id: updatedGroup._id } : g));
      } catch (err: any) {
          alert("Failed to remove member: " + err.message);
      }
  };

  // Profile
  const handleAddAchievement = async (achievement: any) => {
      if (!currentUser) return;
      try {
          const newAchievements = [...(currentUser.achievements || []), achievement];
          const updatedUser = await api.put('/auth/profile', { achievements: newAchievements }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, achievements: updatedUser.achievements } : null);
      } catch (err: any) {
          console.error("Failed to add achievement", err);
      }
  };

  const handleAddInterest = async (interest: string) => {
      if (!currentUser) return;
      try {
          const newInterests = [...(currentUser.interests || []), interest];
          const updatedUser = await api.put('/auth/profile', { interests: newInterests }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, interests: updatedUser.interests } : null);
      } catch (err: any) {
          console.error("Failed to add interest", err);
      }
  };

  const handleUpdateProfile = async (updateData: any, avatarFile?: File | null) => {
      if (!currentUser) return;
      let avatarUrl = currentUser.avatarUrl;

      if (avatarFile && storage) {
          try {
              const storageRef = storage.ref().child(`avatars/${currentUser.id}`);
              const snapshot = await storageRef.put(avatarFile);
              avatarUrl = await snapshot.ref.getDownloadURL();
          } catch (err) {
              console.error("Failed to upload avatar to Firebase Storage", err);
          }
      }

      try {
          const updatedUser = await api.put('/auth/profile', { ...updateData, avatarUrl }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : null);
      } catch (err: any) {
          console.error("Failed to update profile", err);
      }
  };

  // Academics & Courses
  const handleCreateCourse = async (courseData: any) => {
      if (!currentUser) return;
      try {
          const newCourse = await api.post('/courses', {
              ...courseData,
              collegeId: currentUser.collegeId,
          }, currentUser.token);
          setCourses(prev => [...prev, { ...newCourse, id: newCourse._id }]);
      } catch (err: any) {
          console.error("Failed to create course", err);
      }
  };

  const handleUpdateCourse = async (courseId: string, data: any) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.put(`/courses/${courseId}`, data, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to update course", err);
      }
  };

  const handleDeleteCourse = async (courseId: string) => {
      if (!currentUser) return;
      try {
          await api.delete(`/courses/${courseId}`, currentUser.token);
          setCourses(prev => prev.filter(c => c.id !== courseId));
      } catch (err: any) {
          console.error("Failed to delete course", err);
      }
  };

  const handleRequestToJoinCourse = async (courseId: string) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.post(`/courses/${courseId}/join`, {}, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to request to join course", err);
      }
  };

  const handleUpdateCourseFaculty = async (courseId: string, newFacultyId: string) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.put(`/courses/${courseId}`, { facultyId: newFacultyId }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to update course faculty", err);
      }
  };

  // Notices
  const handleCreateNotice = async (noticeData: any) => {
      if (!currentUser) return;
      try {
          const { mediaDataUrl, ...rest } = noticeData;
          let mediaUrl = undefined;
          if (mediaDataUrl) {
              if (!storage) throw new Error("Cloud storage is unavailable.");
              const blob = dataURLtoBlob(mediaDataUrl);
              const fileRef = storage.ref().child(`notices/${currentUser.id}/${Date.now()}`);
              const snapshot = await fileRef.put(blob);
              mediaUrl = await snapshot.ref.getDownloadURL();
          }

          const newNotice = await api.post('/notices', {
              ...rest,
              mediaUrl,
              collegeId: currentUser.collegeId,
          }, currentUser.token);
          setNotices(prev => [{ ...newNotice, id: newNotice._id }, ...prev]);
      } catch (err: any) {
          console.error("Failed to create notice:", err);
          throw err;
      }
  };

  const handleDeleteNotice = async (noticeId: string) => {
      if (!currentUser) return;
      try {
          await api.delete(`/notices/${noticeId}`, currentUser.token);
          setNotices(prev => prev.filter(n => n.id !== noticeId));
      } catch (err: any) {
          console.error("Failed to delete notice", err);
      }
  };

  // Admin/HOD User Management
  const handleCreateUser = async (userData: any) => {
      if (!currentUser) return;
      try {
          const newUser = await api.post('/auth/invite', {
              ...userData,
              collegeId: currentUser.collegeId,
          }, currentUser.token);
          setUsers(prev => ({ ...prev, [newUser._id]: { ...newUser, id: newUser._id } }));
      } catch (err: any) {
          console.error("Failed to create user", err);
          throw err;
      }
  };

  const handleCreateUsersBatch = async (usersData: any[]) => {
      if (!currentUser) return { successCount: 0, errors: ["Not logged in"] };
      let successCount = 0;
      const errors: any[] = [];

      for (const u of usersData) {
          try {
              await handleCreateUser(u);
              successCount++;
          } catch (err: any) {
              errors.push({ email: u.email, reason: err.message });
          }
      }
      return { successCount, errors };
  };

  const handleApproveTeacherRequest = async (userId: string) => {
      if (!currentUser) return;
      try {
          const updatedUser = await api.put(`/auth/users/${userId}`, { isApproved: true }, currentUser.token);
          setUsers(prev => ({ ...prev, [userId]: { ...prev[userId], isApproved: true } }));
      } catch (err) {}
  };

  const handleDeclineTeacherRequest = async (userId: string) => {
      await onDeleteUser(userId);
  };

  const handleApproveHodRequest = async (userId: string) => {
      if (!currentUser) return;
      try {
          const updatedUser = await api.put(`/auth/users/${userId}`, { isApproved: true }, currentUser.token);
          setUsers(prev => ({ ...prev, [userId]: { ...prev[userId], isApproved: true } }));
      } catch (err) {}
  };

  const handleDeclineHodRequest = async (userId: string) => {
      await onDeleteUser(userId);
  };

  const onDeleteUser = async (userId: string) => {
      if (!currentUser) return;
      try {
          await api.delete(`/auth/users/${userId}`, currentUser.token);
          setUsers(prev => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
          });
      } catch (err: any) {
          console.error("Failed to delete user", err);
      }
  };

  const onToggleFreezeUser = async (userId: string) => {
      if (!currentUser) return;
      const user = users[userId];
      try {
          const updatedUser = await api.put(`/auth/users/${userId}`, { isFrozen: !user.isFrozen }, currentUser.token);
          setUsers(prev => ({ ...prev, [userId]: { ...prev[userId], isFrozen: !user.isFrozen } }));
      } catch (err) {}
  };

  const onUpdateUserRole = async (userId: string, updateData: { tag: UserTag, department: string }) => {
      if (!currentUser) return;
      try {
           const updatedUser = await api.put(`/auth/users/${userId}`, updateData, currentUser.token);
           setUsers(prev => ({ ...prev, [userId]: { ...prev[userId], ...updateData } }));
      } catch (err) {}
  }

  // Super Admin
  const handleCreateCollegeAdmin = async (collegeName: string, email: string) => {
      if (!currentUser) return;
      try {
          // 1. Create User (Director Invite)
          const newUser = await api.post('/auth/invite', {
              email: email.toLowerCase(),
              name: 'Director (Pending)',
              tag: 'Director',
              isApproved: true,
              requestedCollegeName: collegeName
          }, currentUser.token);

          // 2. Create College
          const college = await api.post('/colleges', {
              name: collegeName,
              adminUids: [newUser._id],
              departments: []
          }, currentUser.token);

          // 3. Link College back to User
          await api.put(`/auth/users/${newUser._id}`, { collegeId: college._id }, currentUser.token);

          // Update local state immediately for better responsiveness
          setColleges(prev => [...prev, { ...college, id: college._id }]);
          setUsers(prev => ({ ...prev, [newUser._id]: { ...newUser, id: newUser._id, collegeId: college._id } }));

          alert("College and Director created successfully!");
      } catch (error: any) {
          alert("Failed to create college: " + error.message);
      }
  };

  const handleApproveDirector = async (directorId: string, collegeName: string) => {
      if (!currentUser) return;
      try {
          // 1. Create College
          const college = await api.post('/colleges', {
              name: collegeName,
              adminUids: [directorId],
              departments: []
          }, currentUser.token);

          // 2. Update Director User (approve and set collegeId)
          await api.put(`/auth/users/${directorId}`, { isApproved: true, collegeId: college._id }, currentUser.token);

          // Update local state
          setColleges(prev => [...prev, { ...college, id: college._id }]);
          setUsers(prev => ({
              ...prev,
              [directorId]: { ...prev[directorId], isApproved: true, collegeId: college._id }
          }));

          alert("Director approved and college created successfully.");
      } catch (error: any) {
          console.error("Approval failed:", error);
          alert("Approval failed: " + error.message);
      }
  };

  // College Management
  const onUpdateCollegeDepartments = async (collegeId: string, departments: string[]) => {
      if (!currentUser) return;
      try {
          const updatedCollege = await api.put(`/colleges/${collegeId}`, { departments }, currentUser.token);
          setColleges(prev => prev.map(c => c.id === collegeId ? { ...updatedCollege, id: updatedCollege._id } : c));
      } catch (err: any) {
          console.error("Failed to update college departments", err);
      }
  };

  const onEditCollegeDepartment = async (collegeId: string, oldName: string, newName: string) => {
      if (!currentUser) return;
      const college = colleges.find(c => c.id === collegeId);
      if (!college) return;

      const updatedDepartments = (college.departments || []).map(d => d === oldName ? newName : d);

      try {
          const updatedCollege = await api.put(`/colleges/${collegeId}`, { departments: updatedDepartments }, currentUser.token);
          setColleges(prev => prev.map(c => c.id === collegeId ? { ...updatedCollege, id: updatedCollege._id } : c));

          // Also update all users in that department
          const usersInDept = Object.values(users).filter(u => u.collegeId === collegeId && u.department === oldName);

          if (usersInDept.length > 0) {
              // Using Promise.all to perform concurrent updates
              await Promise.all(usersInDept.map(user =>
                  api.put(`/auth/users/${user.id}`, { department: newName }, currentUser.token)
              ));

              // Single state update for all affected users
              setUsers(prev => {
                  const newUsers = { ...prev };
                  usersInDept.forEach(user => {
                      if (newUsers[user.id]) {
                          newUsers[user.id] = { ...newUsers[user.id], department: newName };
                      }
                  });
                  return newUsers;
              });
          }
      } catch (err: any) {
          console.error("Failed to edit college department", err);
          alert("Failed to update department for some users. Please refresh.");
      }
  };

  const onDeleteCollegeDepartment = async (collegeId: string, deptName: string) => {
      if (!currentUser) return;
      const college = colleges.find(c => c.id === collegeId);
      if (!college) return;

      const updatedDepartments = (college.departments || []).filter(d => d !== deptName);

      try {
          const updatedCollege = await api.put(`/colleges/${collegeId}`, { departments: updatedDepartments }, currentUser.token);
          setColleges(prev => prev.map(c => c.id === collegeId ? { ...updatedCollege, id: updatedCollege._id } : c));
      } catch (err: any) {
          console.error("Failed to delete college department", err);
      }
  };

  const onUpdateCollegeClasses = async (collegeId: string, department: string, classes: any) => {
      if (!currentUser) return;
      try {
          // This might need specific backend logic for nested Map update
          const updatedCollege = await api.put(`/colleges/${collegeId}`, { [`classes.${department}`]: classes }, currentUser.token);
          setColleges(prev => prev.map(c => c.id === collegeId ? { ...updatedCollege, id: updatedCollege._id } : c));
      } catch (err: any) {
          console.error("Failed to update college classes", err);
      }
  };

  // Personal Notes
  const handleCreateNote = async (title: string, content: string) => {
      if (!currentUser) return;
      const newNote = {
          id: Date.now().toString(),
          title,
          content,
          timestamp: Date.now()
      };
      try {
          const newNotes = [...(currentUser.personalNotes || []), newNote];
          const updatedUser = await api.put('/auth/profile', { personalNotes: newNotes }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, personalNotes: updatedUser.personalNotes } : null);
      } catch (err: any) {
          console.error("Failed to create note", err);
      }
  };

  const handleUpdateNote = async (noteId: string, title: string, content: string) => {
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.map(n =>
          n.id === noteId ? { ...n, title, content, timestamp: Date.now() } : n
      );
      try {
          const updatedUser = await api.put('/auth/profile', { personalNotes: updatedNotes }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, personalNotes: updatedUser.personalNotes } : null);
      } catch (err: any) {
          console.error("Failed to update note", err);
      }
  };

  const handleDeleteNote = async (noteId: string) => {
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.filter(n => n.id !== noteId);
      try {
          const updatedUser = await api.put('/auth/profile', { personalNotes: updatedNotes }, currentUser.token);
          setCurrentUser(prev => prev ? { ...prev, personalNotes: updatedUser.personalNotes } : null);
      } catch (err: any) {
          console.error("Failed to delete note", err);
      }
  };

  // Course management
  const handleAddNote = async (courseId: string, note: { title: string, fileUrl: string, fileName: string }) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.post(`/courses/${courseId}/resources`, { type: 'note', resource: note }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to add note", err);
      }
  };

  const handleAddAssignment = async (courseId: string, assignment: { title: string, fileUrl: string, fileName: string, dueDate: number }) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.post(`/courses/${courseId}/resources`, { type: 'assignment', resource: assignment }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to add assignment", err);
      }
  };

  const handleTakeAttendance = async (courseId: string, record: AttendanceRecord) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.post(`/courses/${courseId}/attendance`, record, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to take attendance", err);
      }
  };

  const handleManageCourseRequest = async (courseId: string, studentId: string, action: 'approve' | 'reject') => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.post(`/courses/${courseId}/request/${studentId}`, { action }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to manage course request", err);
      }
  };

  const handleAddStudentsToCourse = async (courseId: string, studentIds: string[]) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.post(`/courses/${courseId}/students`, { studentIds }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to add students to course", err);
      }
  };

  const handleRemoveStudentFromCourse = async (courseId: string, studentId: string) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.delete(`/courses/${courseId}/students/${studentId}`, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to remove student from course", err);
      }
  };

  const handleSendCourseMessage = async (courseId: string, text: string, mediaDataUrl?: string, mediaType?: 'image' | 'video') => {
      if (!currentUser) return;
      try {
          let mediaUrl = undefined;
          if (mediaDataUrl) {
              if (!storage) throw new Error("Cloud storage is unavailable.");
              const blob = dataURLtoBlob(mediaDataUrl);
              const fileRef = storage.ref().child(`courses/${courseId}/chats/${Date.now()}`);
              const snapshot = await fileRef.put(blob);
              mediaUrl = await snapshot.ref.getDownloadURL();
          }

          const messages = await api.post(`/courses/${courseId}/messages`, { text, mediaUrl, mediaType }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...c, messages } : c));
      } catch (err: any) {
          console.error("Failed to send course message:", err);
          throw err;
      }
  };

  const handleSendDepartmentMessage = async (department: string, channel: string, text: string, mediaDataUrl?: string, mediaType?: 'image' | 'video') => {
      if (!currentUser) return;
      try {
          let mediaUrl = undefined;
          if (mediaDataUrl) {
              if (!storage) throw new Error("Cloud storage is unavailable.");
              const blob = dataURLtoBlob(mediaDataUrl);
              const fileRef = storage.ref().child(`department-chats/${currentUser.collegeId}/${department}/${Date.now()}`);
              const snapshot = await fileRef.put(blob);
              mediaUrl = await snapshot.ref.getDownloadURL();
          }

          const newMessage = await api.post('/department-chats', {
              collegeId: currentUser.collegeId,
              department,
              channel,
              text,
              mediaUrl,
              mediaType
          }, currentUser.token);
          setDepartmentChats(prev => {
              const exists = prev.find(c => c.department === department && c.channel === channel);
              if (exists) {
                  return prev.map(c => c.department === department && c.channel === channel ? { ...c, messages: [...c.messages, newMessage] } : c);
              } else {
                  return [...prev, {
                      id: `${department}-${channel}`,
                      department,
                      channel,
                      collegeId: currentUser.collegeId,
                      messages: [newMessage]
                  }];
              }
          });
      } catch (err: any) {
          console.error("Failed to send department message", err);
      }
  };

  const handleUpdateCoursePersonalNote = async (courseId: string, note: string) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.put(`/courses/${courseId}/personal-note`, { note }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to update course personal note", err);
      }
  };

  const handleSaveFeedback = async (courseId: string, rating: number, comment: string) => {
      if (!currentUser) return;
      try {
          const updatedCourse = await api.post(`/courses/${courseId}/feedback`, { rating, comment }, currentUser.token);
          setCourses(prev => prev.map(c => c.id === courseId ? { ...updatedCourse, id: updatedCourse._id } : c));
      } catch (err: any) {
          console.error("Failed to save feedback", err);
      }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        </div>
    );
  }

  if (!currentUser) {
    return currentPath === '#/signup' ? <SignupPage onNavigate={setCurrentPath} /> : <LoginPage onNavigate={setCurrentPath} />;
  }

  if (currentPath.startsWith('#/superadmin')) {
      return (
          <SuperAdminPage
            colleges={colleges}
            users={users}
            onCreateCollegeAdmin={handleCreateCollegeAdmin}
            onNavigate={setCurrentPath}
            currentUser={currentUser}
            currentPath={currentPath}
            onApproveDirector={handleApproveDirector}
            onDeleteUser={onDeleteUser}
          />
      );
  }

  if (currentPath === '#/hod' || currentPath.startsWith('#/director/view/')) {
      let hodUser = currentUser;
      let isViewingAsDirector = false;

      if (currentPath.startsWith('#/director/view/') && currentUser.tag === 'Director') {
          const hodId = currentPath.split('/director/view/')[1];
          hodUser = users[hodId] || currentUser;
          isViewingAsDirector = true;
      }

      return (
          <HodPage
            currentUser={hodUser}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            isViewingAsDirector={isViewingAsDirector}
            courses={courses}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            notices={notices}
            users={users}
            allUsers={Object.values(users)}
            onCreateNotice={handleCreateNotice}
            onDeleteNotice={handleDeleteNotice}
            departmentChats={departmentChats}
            onSendDepartmentMessage={handleSendDepartmentMessage}
            onCreateUser={handleCreateUser}
            onCreateUsersBatch={handleCreateUsersBatch}
            onApproveTeacherRequest={handleApproveTeacherRequest}
            onDeclineTeacherRequest={handleDeclineTeacherRequest}
            colleges={colleges}
            onUpdateCourseFaculty={handleUpdateCourseFaculty}
            onUpdateCollegeClasses={onUpdateCollegeClasses}
            onDeleteUser={onDeleteUser}
            onToggleFreezeUser={onToggleFreezeUser}
            onUpdateUserRole={onUpdateUserRole}
          />
      );
  }

  if (currentPath.startsWith('#/director')) {
      return (
          <DirectorPage
            currentUser={currentUser}
            allUsers={Object.values(users)}
            allPosts={posts}
            allGroups={groups}
            allCourses={courses}
            usersMap={users}
            notices={notices}
            colleges={colleges}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onDeleteUser={onDeleteUser}
            onDeletePost={handleDeletePost}
            onDeleteGroup={handleDeleteGroup}
            onApproveHodRequest={handleApproveHodRequest}
            onDeclineHodRequest={handleDeclineHodRequest}
            onApproveTeacherRequest={handleApproveTeacherRequest}
            onDeclineTeacherRequest={handleDeclineTeacherRequest}
            onToggleFreezeUser={onToggleFreezeUser}
            onUpdateUserRole={onUpdateUserRole}
            onCreateNotice={handleCreateNotice}
            onDeleteNotice={handleDeleteNotice}
            onCreateCourse={handleCreateCourse}
            onCreateUser={handleCreateUser}
            onDeleteCourse={handleDeleteCourse}
            onUpdateCollegeDepartments={onUpdateCollegeDepartments}
            onEditCollegeDepartment={onEditCollegeDepartment}
            onDeleteCollegeDepartment={onDeleteCollegeDepartment}
            onUpdateCourseFaculty={handleUpdateCourseFaculty}
            postCardProps={{
                onReaction: handleReaction,
                onAddComment: handleAddComment,
                onDeletePost: handleDeletePost,
                onDeleteComment: handleDeleteComment,
                onCreateOrOpenConversation: handleCreateOrOpenConversation,
                onSharePostAsMessage: handleSharePostAsMessage,
                onSharePost: handleSharePost,
                onToggleSavePost: handleToggleSavePost,
                groups: groups
            }}
          />
      );
  }

  // Routes
  if (currentPath.startsWith('#/profile/')) {
      const userId = currentPath.split('/profile/')[1];
      return (
        <ProfilePage
            profileUserId={userId}
            currentUser={currentUser}
            users={users}
            posts={posts}
            groups={groups}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onAddPost={handleAddPost}
            onAddAchievement={handleAddAchievement}
            onAddInterest={handleAddInterest}
            onUpdateProfile={handleUpdateProfile}
            onReaction={handleReaction}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onCreateOrOpenConversation={handleCreateOrOpenConversation}
            onSharePostAsMessage={handleSharePostAsMessage}
            onSharePost={handleSharePost}
            onToggleSavePost={handleToggleSavePost}
            colleges={colleges}
            courses={courses}
        />
      );
  }

  if (currentPath === '#/groups') {
      return (
        <GroupsPage
            currentUser={currentUser}
            groups={groups}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onCreateGroup={handleCreateGroup}
            onJoinGroupRequest={handleJoinGroupRequest}
            onToggleFollowGroup={handleToggleFollowGroup}
        />
      );
  }

  if (currentPath.startsWith('#/groups/')) {
      const groupId = currentPath.split('/groups/')[1];
      const group = groups.find(g => g.id === groupId);
      return group ? (
        <GroupDetailPage
            group={group}
            currentUser={currentUser}
            users={users}
            posts={posts}
            groups={groups}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onAddPost={(details) => handleAddPost({...details, groupId: group.id})}
            onAddStory={(details) => handleAddStory({...details, groupId: group.id})}
            onReaction={handleReaction}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onCreateOrOpenConversation={handleCreateOrOpenConversation}
            onSharePostAsMessage={handleSharePostAsMessage}
            onSharePost={handleSharePost}
            onToggleSavePost={handleToggleSavePost}
            onJoinGroupRequest={handleJoinGroupRequest}
            onApproveJoinRequest={handleApproveJoinRequest}
            onDeclineJoinRequest={handleDeclineJoinRequest}
            onDeleteGroup={handleDeleteGroup}
            onSendGroupMessage={handleSendGroupMessage}
            onRemoveGroupMember={handleRemoveGroupMember}
            onToggleFollowGroup={handleToggleFollowGroup}
            onUpdateGroup={handleUpdateGroup}
        />
      ) : <div>Group Not Found</div>;
  }

  if (currentPath === '#/events') {
      return (
          <EventsPage
            currentUser={currentUser}
            users={users}
            events={posts.filter(p => p.isEvent)}
            groups={groups}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onAddPost={handleAddPost}
            onReaction={handleReaction}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onCreateOrOpenConversation={handleCreateOrOpenConversation}
            onSharePostAsMessage={handleSharePostAsMessage}
            onSharePost={handleSharePost}
            onToggleSavePost={handleToggleSavePost}
          />
      );
  }

  if (currentPath.startsWith('#/events/')) {
      const eventId = currentPath.split('/events/')[1];
      return (
          <EventDetailPage
            eventId={eventId}
            posts={posts}
            users={users}
            currentUser={currentUser}
            onNavigate={setCurrentPath}
            onRegister={async (eid) => {
                if (!currentUser) return;
                try {
                    const attendees = await api.post(`/posts/${eid}/register`, {}, currentUser.token);
                    setPosts(prev => prev.map(p => p.id === eid ? { ...p, eventDetails: p.eventDetails ? { ...p.eventDetails, attendees } : undefined } : p));
                } catch (err) {
                    console.error("Failed to register for event", err);
                }
            }}
            onUnregister={async (eid) => {
                if (!currentUser) return;
                try {
                    const attendees = await api.post(`/posts/${eid}/unregister`, {}, currentUser.token);
                    setPosts(prev => prev.map(p => p.id === eid ? { ...p, eventDetails: p.eventDetails ? { ...p.eventDetails, attendees } : undefined } : p));
                } catch (err) {
                    console.error("Failed to unregister from event", err);
                }
            }}
            onDeleteEvent={handleDeletePost}
          />
      );
  }

  if (currentPath === '#/opportunities') {
      return (
          <OpportunitiesPage
            currentUser={currentUser}
            users={users}
            posts={posts}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onAddPost={handleAddPost}
            postCardProps={{ onDeletePost: handleDeletePost }}
          />
      );
  }

  if (currentPath === '#/chat') {
      return (
          <ChatPage
            currentUser={currentUser}
            users={users}
            conversations={conversations}
            onSendMessage={handleSendMessage}
            onDeleteMessagesForEveryone={handleDeleteMessagesForEveryone}
            onDeleteMessagesForSelf={handleDeleteMessagesForSelf}
            onDeleteConversations={handleDeleteConversations}
            onCreateOrOpenConversation={handleCreateOrOpenConversation}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
          />
      );
  }

  if (currentPath === '#/academics') {
      return (
          <AcademicsPage
            currentUser={currentUser}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            courses={courses}
            onCreateCourse={handleCreateCourse}
            notices={notices}
            users={users}
            onCreateNotice={handleCreateNotice}
            onDeleteNotice={handleDeleteNotice}
            onRequestToJoinCourse={handleRequestToJoinCourse}
            departmentChats={departmentChats}
            onSendDepartmentMessage={handleSendDepartmentMessage}
            onCreateUser={handleCreateUser}
            onApproveTeacherRequest={handleApproveTeacherRequest}
            onDeclineTeacherRequest={handleDeclineTeacherRequest}
            colleges={colleges}
          />
      );
  }

  if (currentPath.startsWith('#/academics/')) {
      const parts = currentPath.split('/');
      const courseId = parts[2];
      const tab = parts[3]; // e.g. 'attendance'
      const course = courses.find(c => c.id === courseId);

      if (course) {
          return (
              <CourseDetailPage
                course={course}
                currentUser={currentUser}
                allUsers={Object.values(users)}
                students={Object.values(users).filter((u: User) => {
                    if (u.tag !== 'Student') return false;

                    // 1. Explicitly enrolled
                    const isExplicitlyEnrolled = course.students?.includes(u.id);

                    // 2. Check implicit class matching (Department + Year + Division)
                    // This ensures all students of the class show up for attendance
                    const isClassMatch =
                        u.department === course.department &&
                        u.yearOfStudy === course.year &&
                        (!course.division || u.division === course.division);

                    return isExplicitlyEnrolled || isClassMatch;
                })}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onAddNote={handleAddNote}
                onAddAssignment={handleAddAssignment}
                onTakeAttendance={handleTakeAttendance}
                onRequestToJoinCourse={handleRequestToJoinCourse}
                onManageCourseRequest={handleManageCourseRequest}
                onAddStudentsToCourse={handleAddStudentsToCourse}
                onRemoveStudentFromCourse={handleRemoveStudentFromCourse}
                onSendCourseMessage={handleSendCourseMessage}
                onUpdateCoursePersonalNote={handleUpdateCoursePersonalNote}
                onSaveFeedback={handleSaveFeedback}
                onDeleteCourse={handleDeleteCourse}
                onUpdateCourseFaculty={handleUpdateCourseFaculty}
                initialTab={tab}
              />
          );
      }
  }

  if (currentPath === '#/notes') {
      return (
          <PersonalNotesPage
            currentUser={currentUser}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
      );
  }

  if (currentPath === '#/notices') {
      return (
          <NoticeBoardPage
            currentUser={currentUser}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            notices={notices}
            users={users}
            onCreateNotice={handleCreateNotice}
            onDeleteNotice={handleDeleteNotice}
          />
      );
  }

  if (currentPath === '#/search') {
      return (
          <SearchPage
            currentUser={currentUser}
            users={Object.values(users)}
            posts={posts}
            groups={groups}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onReaction={handleReaction}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onCreateOrOpenConversation={handleCreateOrOpenConversation}
            onSharePostAsMessage={handleSharePostAsMessage}
            onSharePost={handleSharePost}
            onToggleSavePost={handleToggleSavePost}
          />
      );
  }

  if (currentPath === '#/confessions') {
      return (
          <ConfessionsPage
            currentUser={currentUser}
            users={users}
            posts={posts}
            groups={groups}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            onAddPost={handleAddPost}
            onReaction={handleReaction}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onCreateOrOpenConversation={handleCreateOrOpenConversation}
            onSharePostAsMessage={handleSharePostAsMessage}
            onSharePost={handleSharePost}
            onToggleSavePost={handleToggleSavePost}
          />
      );
  }

  // Default Fallback
  return (
      <div className="relative">
          {backendStatus === 'disconnected' && (
              <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-[10px] font-bold py-1 text-center z-[9999] animate-pulse">
                  ⚠️ Backend/Database Disconnected. Please check your setup.
              </div>
          )}
      <HomePage
        currentUser={currentUser}
        users={users}
        posts={posts}
        stories={stories}
        groups={groups}
        events={posts.filter(p => p.isEvent)}
        notices={notices}
        onNavigate={setCurrentPath}
        onLogout={() => logout(setCurrentPath)}
        onAddPost={handleAddPost}
        onAddStory={handleAddStory}
        onMarkStoryAsViewed={handleMarkStoryAsViewed}
        onDeleteStory={handleDeleteStory}
        onReplyToStory={handleReplyToStory}
        currentPath={currentPath}
        onReaction={handleReaction}
        onAddComment={handleAddComment}
        onDeletePost={handleDeletePost}
        onDeleteComment={handleDeleteComment}
        onCreateOrOpenConversation={handleCreateOrOpenConversation}
        onSharePostAsMessage={handleSharePostAsMessage}
        onSharePost={handleSharePost}
        onToggleSavePost={handleToggleSavePost}
      />
      </div>
  );
};

export default App;
