
import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, storage, FieldValue } from './firebase';
import { api } from './api';
import type { User, Post, Group, Story, Course, Notice, Conversation, College, PersonalNote, UserTag, GroupCategory, GroupPrivacy, AttendanceRecord, Note, Assignment } from './types';

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
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [currentPath, setCurrentPath] = useState('#/');

  // Data State
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);

  const checkHealth = async () => {
    try {
      const data = await api.get('/health');
      setBackendStatus(data.database === 'connected' ? 'connected' : 'disconnected');
    } catch (err) {
      setBackendStatus('disconnected');
    }
  };

  // 0. Listen to Firebase Realtime Data (Conditional)
  useEffect(() => {
    if (!db || !currentUser) return;

    // Users
    const unsubUsers = db.collection('users').onSnapshot((snapshot: any) => {
        const usersData: { [key: string]: User } = {};
        snapshot.forEach((doc: any) => {
            const data = doc.data();
            usersData[doc.id] = { ...data, id: doc.id };
        });
        setUsers(usersData);
    });

    // Groups (Initial Fetch + Periodic Refresh if using API, or keep Firestore for realtime)
    // For this task, we'll keep Firestore realtime BUT use API for mutations.
    // However, the user asked to save to MongoDB.
    // To see MongoDB data, we should fetch from API.
    let groupsInterval: any;
    if (currentUser) {
        const fetchGroups = async () => {
            try {
                const data = await api.get('/groups', currentUser.token);
                setGroups(data.map((g: any) => ({ ...g, id: g._id })));
            } catch (err) {
                console.error("Failed to fetch groups from MongoDB", err);
            }
        };

        fetchGroups();
        groupsInterval = setInterval(fetchGroups, 10000); // Poll every 10s as a simple alternative to onSnapshot
    }

    // Stories
    const unsubStories = db.collection('stories').onSnapshot((snapshot: any) => {
        const storiesData = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
        setStories(storiesData);
    });

    // Courses
    const unsubCourses = db.collection('courses').onSnapshot((snapshot: any) => {
        const coursesData = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
        setCourses(coursesData);
    });

    // Notices
    const unsubNotices = db.collection('notices').onSnapshot((snapshot: any) => {
        const noticesData = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
        setNotices(noticesData);
    });

    // Conversations
    const unsubConvos = db.collection('conversations').onSnapshot((snapshot: any) => {
        const convosData = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
        setConversations(convosData);
    });

    // Colleges
    const unsubColleges = db.collection('colleges').onSnapshot((snapshot: any) => {
        const collegesData = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
        setColleges(collegesData);
    });

    return () => {
        unsubUsers();
        clearInterval(groupsInterval);
        unsubStories();
        unsubCourses();
        unsubNotices();
        unsubConvos();
        unsubColleges();
    };
  }, [currentUser]);

  // Backend Health Check
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for storage events (for backend token synchronization)
  useEffect(() => {
      const handleStorageChange = () => {
          const storedUserString = localStorage.getItem('user');
          if (storedUserString) {
              try {
                  const storedUser = JSON.parse(storedUserString);
                  // Reactive merge: Merge the backend token from localStorage into the current state
                  // to avoid overwriting Firestore profile data.
                  setCurrentUser(prev => {
                      if (!prev) return storedUser; // Fallback for manual login
                      if (prev.id === storedUser.id) {
                          return { ...prev, token: storedUser.token };
                      }
                      return prev;
                  });
              } catch (e) {
                  console.error("Failed to parse stored user", e);
              }
          } else if (!auth?.currentUser) {
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

  // 1. Auth State Listener (Firebase + Local Fallback)
  useEffect(() => {
    // Check for existing manual session first (e.g., from API fallback)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Failed to parse stored user", e);
        }
    }

    if (!auth || !db) {
        setLoading(false);
        return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
        if (user) {
            // Fetch profile from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                let userData = { ...userDoc.data(), id: user.uid };

                // Sync backend token from localStorage if available
                const storedUserString = localStorage.getItem('user');
                if (storedUserString) {
                    try {
                        const storedUser = JSON.parse(storedUserString);
                        if (storedUser.id === user.uid && storedUser.token) {
                            userData.token = storedUser.token;
                        } else if (!storedUser.token) {
                             console.warn("User found in localStorage but backend token is missing.");
                        }
                    } catch (e) {
                        console.error("Error parsing stored user for token sync", e);
                    }
                } else {
                    console.warn("No 'user' object found in localStorage for token synchronization.");
                }

                setCurrentUser(userData);
                setAuthUserId(user.uid);
            } else {
                // Handle case where auth user exists but Firestore doc doesn't
                setCurrentUser(null);
                setAuthUserId(null);
            }
        } else {
            // Only clear state if there's no manual session in localStorage
            if (!localStorage.getItem('user')) {
                setAuthUserId(null);
                setCurrentUser(null);
                // Clear other data
                setPosts([]);

                const publicPaths = ['#/', '#/login', '#/signup'];
                if (!publicPaths.includes(window.location.hash)) {
                    setCurrentPath('#/');
                }
            }
        }
        setLoading(false);
    });

    return () => unsubscribe();
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

  // Posts Handlers (MongoDB Backend)
  const handleAddPost = async (postDetails: any) => {
      if (!currentUser) return;
      try {
          // Normalize mediaDataUrls to mediaUrls for backend compatibility if present
          const { mediaDataUrls, ...rest } = postDetails;
          const payload = {
              ...rest,
              mediaUrls: mediaDataUrls || [],
              collegeId: currentUser.collegeId || ''
          };

          const newPost = await api.post('/posts', payload, currentUser.token);
          setPosts(prev => [{ ...newPost, id: newPost._id }, ...prev]);
      } catch (err: any) {
          console.error("Failed to add post", err);
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
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      if (currentUser.savedPosts?.includes(postId)) {
          await db.collection('users').doc(currentUser.id).update({
              savedPosts: FieldValue.arrayRemove(postId)
          });
      } else {
          await db.collection('users').doc(currentUser.id).update({
              savedPosts: FieldValue.arrayUnion(postId)
          });
      }
  };

  const handleSharePost = async (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group', id?: string }) => {
      if (!currentUser) return;
      const sharedPostInfo = {
          originalId: originalPost.id,
          originalAuthorId: originalPost.authorId,
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
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      const newStory = {
          ...storyDetails,
          authorId: currentUser.id,
          timestamp: Date.now(),
          viewedBy: [],
          collegeId: currentUser.collegeId
      };
      await db.collection('stories').add(newStory);
  };

  const handleMarkStoryAsViewed = async (storyId: string) => {
      if (!db || !FieldValue || !currentUser) return;
      await db.collection('stories').doc(storyId).update({
          viewedBy: FieldValue.arrayUnion(currentUser.id)
      });
  };

  const handleDeleteStory = async (storyId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('stories').doc(storyId).delete();
  };

  const handleReplyToStory = async (authorId: string, text: string) => {
      const conversationId = await handleCreateOrOpenConversation(authorId);
      await handleSendMessage(conversationId, text);
  };

  // Chat
  const handleCreateOrOpenConversation = async (otherUserId: string): Promise<string> => {
      if (!currentUser) throw new Error("Not logged in");
      if (!db) throw new Error("Database unavailable");
      const existing = conversations.find(c => !c.isGroupChat && c.participantIds.includes(currentUser.id) && c.participantIds.includes(otherUserId));
      if (existing) return existing.id;

      const newConvoRef = await db.collection('conversations').add({
          participantIds: [currentUser.id, otherUserId],
          messages: [],
          collegeId: currentUser.collegeId
      });
      return newConvoRef.id;
  };

  const handleSendMessage = async (conversationId: string, text: string) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      const newMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      await db.collection('conversations').doc(conversationId).update({
          messages: FieldValue.arrayUnion(newMessage)
      });
  };

  const handleDeleteMessagesForEveryone = async (conversationId: string, messageIds: string[]) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      const convo = conversations.find(c => c.id === conversationId);
      if (!convo) return;
      const updatedMessages = convo.messages.filter(m => !messageIds.includes(m.id));
      await db.collection('conversations').doc(conversationId).update({ messages: updatedMessages });
  };

  const handleDeleteMessagesForSelf = async (conversationId: string, messageIds: string[]) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      const convo = conversations.find(c => c.id === conversationId);
      if (!convo) return;
      const updatedMessages = convo.messages.map(m => {
          if (messageIds.includes(m.id)) {
              return { ...m, deletedFor: [...(m.deletedFor || []), currentUser?.id] };
          }
          return m;
      });
      await db.collection('conversations').doc(conversationId).update({ messages: updatedMessages });
  };

  const handleDeleteConversations = async (conversationIds: string[]) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      for (const id of conversationIds) {
          await db.collection('conversations').doc(id).delete();
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
      try {
          await api.post(`/groups/${groupId}/follow`, {}, currentUser.token);
          // Update local state for immediate feedback (Firestore fallback if enabled)
          if (db && FieldValue && auth?.currentUser) {
             const isFollowing = currentUser.followingGroups?.includes(groupId);
             await db.collection('users').doc(currentUser.id).update({
                 followingGroups: isFollowing ? FieldValue.arrayRemove(groupId) : FieldValue.arrayUnion(groupId)
             });
          }
          // Note: In a full MongoDB migration, we would update the User model in MongoDB here.
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

  const handleSendGroupMessage = async (groupId: string, text: string) => {
      if (!currentUser) return;
      try {
          const messages = await api.post(`/groups/${groupId}/messages`, { text }, currentUser.token);
          setGroups(prev => prev.map(g => g.id === groupId ? { ...g, messages } : g));
      } catch (err: any) {
          console.error("Failed to send group message", err);
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
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      await db.collection('users').doc(currentUser.id).update({
          achievements: FieldValue.arrayUnion(achievement)
      });
  };

  const handleAddInterest = async (interest: string) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      await db.collection('users').doc(currentUser.id).update({
          interests: FieldValue.arrayUnion(interest)
      });
  };

  const handleUpdateProfile = async (updateData: any, avatarFile?: File | null) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      let avatarUrl = currentUser.avatarUrl;

      if (avatarFile && storage) {
          const storageRef = storage.ref().child(`avatars/${currentUser.id}`);
          const snapshot = await storageRef.put(avatarFile);
          avatarUrl = await snapshot.ref.getDownloadURL();
      }

      await db.collection('users').doc(currentUser.id).update({
          ...updateData,
          avatarUrl
      });
  };

  // Academics & Courses
  const handleCreateCourse = async (courseData: any) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      await db.collection('courses').add({
          facultyId: currentUser.id, // Default to creator, but allow override
          ...courseData,
          collegeId: currentUser.collegeId,
      });
  };

  const handleUpdateCourse = async (courseId: string, data: any) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).update(data);
  };

  const handleDeleteCourse = async (courseId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).delete();
  };

  const handleRequestToJoinCourse = async (courseId: string) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      await db.collection('courses').doc(courseId).update({
          pendingStudents: FieldValue.arrayUnion(currentUser.id)
      });
  };

  const handleUpdateCourseFaculty = async (courseId: string, newFacultyId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).update({ facultyId: newFacultyId });
  };

  // Notices
  const handleCreateNotice = async (noticeData: any) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      await db.collection('notices').add({
          ...noticeData,
          authorId: currentUser.id,
          collegeId: currentUser.collegeId,
          timestamp: Date.now()
      });
  };

  const handleDeleteNotice = async (noticeId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('notices').doc(noticeId).delete();
  };

  // Admin/HOD User Management
  const handleCreateUser = async (userData: any, password?: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      const newRef = db.collection('users').doc();
      // If isRegistered is passed (e.g. true), respect it. Otherwise default to false.
      const isRegistered = userData.isRegistered !== undefined ? userData.isRegistered : false;

      await newRef.set({
          ...userData,
          email: userData.email.toLowerCase(), // Normalize email for consistent login/lookup
          collegeId: currentUser?.collegeId, // IMPORTANT: Must inherit collegeId for user to see dashboard
          isRegistered: isRegistered,
          createdAt: Date.now(),
          createdBy: currentUser?.id
      });
  };

  const handleCreateUsersBatch = async (usersData: any[]) => {
      if (!db) return { successCount: 0, errors: ["Database unavailable"] };
      const chunkSize = 450;
      let successCount = 0;
      const errors: any[] = [];

      for (let i = 0; i < usersData.length; i += chunkSize) {
          const batch = db.batch();
          const chunk = usersData.slice(i, i + chunkSize);

          for (const u of chunk) {
              const email = u.email.toLowerCase();
              const existing = (Object.values(users) as User[]).find(existingUser => existingUser.email === email);
              if (existing) {
                  errors.push({ email: u.email, reason: "Email already exists" });
                  continue;
              }

              const newRef = db.collection('users').doc();
              batch.set(newRef, {
                  ...u,
                  email: email,
                  collegeId: currentUser?.collegeId,
                  isRegistered: false,
                  isApproved: true, // Auto-approve when created by admin
                  createdAt: Date.now(),
                  createdBy: currentUser?.id
              });
              successCount++;
          }
          if (chunk.length > 0) {
             await batch.commit();
          }
      }
      return { successCount, errors };
  };

  const handleApproveTeacherRequest = async (userId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('users').doc(userId).update({ isApproved: true });
  };

  const handleDeclineTeacherRequest = async (userId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('users').doc(userId).delete();
  };

  const handleApproveHodRequest = async (userId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('users').doc(userId).update({ isApproved: true });
  };

  const handleDeclineHodRequest = async (userId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('users').doc(userId).delete();
  };

  const onDeleteUser = async (userId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('users').doc(userId).delete();
  };

  const onToggleFreezeUser = async (userId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      const user = users[userId];
      await db.collection('users').doc(userId).update({ isFrozen: !user.isFrozen });
  };

  const onUpdateUserRole = async (userId: string, updateData: { tag: UserTag, department: string }) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('users').doc(userId).update(updateData);
  }

  // Super Admin
  const handleCreateCollegeAdmin = async (collegeName: string, email: string, password: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      try {
          const normalizedEmail = email.toLowerCase();
          // 1. Create the User Invite Document first to get an ID
          const userInviteRef = await db.collection('users').add({
              email: normalizedEmail,
              name: 'Director (Pending)',
              tag: 'Director',
              isRegistered: false,
              isApproved: true, // Manual add = Approved invite
              createdAt: Date.now(),
              createdBy: currentUser?.id
          });

          // 2. Create the College Document with the User ID
          const collegeRef = await db.collection('colleges').add({
              name: collegeName,
              adminUids: [userInviteRef.id], // Link immediately
              departments: [],
              createdAt: Date.now(),
              createdBy: currentUser?.id
          });

          // 3. Update User with College ID and requestedCollegeName (for consistency)
          await userInviteRef.update({
              collegeId: collegeRef.id,
              requestedCollegeName: collegeName // Optional but good for tracking
          });

          alert("College and Director Invite created successfully!");
      } catch (error: any) {
          alert("Failed to create college: " + error.message);
      }
  };

  const handleApproveDirector = async (directorId: string, collegeName: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      try {
          if (!currentUser) {
              alert("Session expired. Please refresh.");
              return;
          }
          if (!collegeName) {
              alert("Invalid request: Missing college name.");
              return;
          }

          // 1. Create College
          const collegeRef = await db.collection('colleges').add({
              name: collegeName,
              adminUids: [directorId],
              departments: [],
              createdAt: Date.now(),
              createdBy: currentUser.id
          });

          // 2. Update Director User
          await db.collection('users').doc(directorId).update({
              isApproved: true,
              collegeId: collegeRef.id,
              requestedCollegeName: FieldValue ? FieldValue.delete() : undefined
          });

          alert("Director approved and college created successfully.");
      } catch (error: any) {
          console.error("Approval failed:", error);
          alert("Approval failed: " + error.message);
      }
  };

  // College Management
  const onUpdateCollegeDepartments = async (collegeId: string, departments: string[]) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('colleges').doc(collegeId).update({ departments });
  };

  const onUpdateCollegeClasses = async (collegeId: string, department: string, classes: any) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('colleges').doc(collegeId).update({
          [`classes.${department}`]: classes
      });
  };

  // Personal Notes
  const handleCreateNote = async (title: string, content: string) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      const newNote = {
          id: Date.now().toString(),
          title,
          content,
          timestamp: Date.now()
      };
      await db.collection('users').doc(currentUser.id).update({
          personalNotes: FieldValue.arrayUnion(newNote)
      });
  };

  const handleUpdateNote = async (noteId: string, title: string, content: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.map(n =>
          n.id === noteId ? { ...n, title, content, timestamp: Date.now() } : n
      );
      await db.collection('users').doc(currentUser.id).update({ personalNotes: updatedNotes });
  };

  const handleDeleteNote = async (noteId: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.filter(n => n.id !== noteId);
      await db.collection('users').doc(currentUser.id).update({ personalNotes: updatedNotes });
  };

  // Course management
  const handleAddNote = async (courseId: string, note: { title: string, fileUrl: string, fileName: string }) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).update({
          notes: FieldValue.arrayUnion({ ...note, id: Date.now().toString(), uploadedAt: Date.now() })
      });
  };

  const handleAddAssignment = async (courseId: string, assignment: { title: string, fileUrl: string, fileName: string, dueDate: number }) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).update({
          assignments: FieldValue.arrayUnion({ ...assignment, id: Date.now().toString(), postedAt: Date.now() })
      });
  };

  const handleTakeAttendance = async (courseId: string, record: AttendanceRecord) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).update({
          attendanceRecords: FieldValue.arrayUnion(record)
      });
  };

  const handleManageCourseRequest = async (courseId: string, studentId: string, action: 'approve' | 'reject') => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (action === 'approve') {
          await db.collection('courses').doc(courseId).update({
              pendingStudents: FieldValue.arrayRemove(studentId),
              students: FieldValue.arrayUnion(studentId)
          });
      } else {
          await db.collection('courses').doc(courseId).update({
              pendingStudents: FieldValue.arrayRemove(studentId)
          });
      }
  };

  const handleAddStudentsToCourse = async (courseId: string, studentIds: string[]) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).update({
          students: FieldValue.arrayUnion(...studentIds)
      });
  };

  const handleRemoveStudentFromCourse = async (courseId: string, studentId: string) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      await db.collection('courses').doc(courseId).update({
          students: FieldValue.arrayRemove(studentId)
      });
  };

  const handleSendCourseMessage = async (courseId: string, text: string) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      const newMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      await db.collection('courses').doc(courseId).update({
          messages: FieldValue.arrayUnion(newMessage)
      });
  };

  const handleUpdateCoursePersonalNote = async (courseId: string, note: string) => {
      if (!db) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      await db.collection('courses').doc(courseId).update({
          [`personalNotes.${currentUser.id}`]: note
      });
  };

  const handleSaveFeedback = async (courseId: string, rating: number, comment: string) => {
      if (!db || !FieldValue) {
          alert("Database unavailable.");
          return;
      }
      if (!currentUser) return;
      const feedback = {
          studentId: currentUser.id,
          rating,
          comment,
          timestamp: Date.now()
      };
      await db.collection('courses').doc(courseId).update({
          feedback: FieldValue.arrayUnion(feedback)
      });
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
            onEditCollegeDepartment={(cid, oldName, newName) => {}}
            onDeleteCollegeDepartment={(cid, deptName) => {}}
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

  if (currentPath === '#/hod') {
      return (
          <HodPage
            currentUser={currentUser}
            onNavigate={setCurrentPath}
            currentPath={currentPath}
            courses={courses}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            notices={notices}
            users={users}
            allUsers={Object.values(users)}
            onCreateNotice={handleCreateNotice}
            onDeleteNotice={handleDeleteNotice}
            departmentChats={[]}
            onSendDepartmentMessage={()=>{}}
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
                    setPosts(prev => prev.map(p => p.id === eid ? { ...p, eventDetails: { ...p.eventDetails, attendees } } : p));
                } catch (err) {
                    console.error("Failed to register for event", err);
                }
            }}
            onUnregister={async (eid) => {
                if (!currentUser) return;
                try {
                    const attendees = await api.post(`/posts/${eid}/unregister`, {}, currentUser.token);
                    setPosts(prev => prev.map(p => p.id === eid ? { ...p, eventDetails: { ...p.eventDetails, attendees } } : p));
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
            departmentChats={[]}
            onSendDepartmentMessage={()=>{}}
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
