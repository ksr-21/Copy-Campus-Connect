
import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import type { User, Post, Group, Story, Course, Notice, Conversation, College, PersonalNote, UserTag, GroupCategory, GroupPrivacy, AttendanceRecord, Note, Assignment } from './types';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
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

  // 1. Auth State Listener (using LocalStorage)
  useEffect(() => {
    const syncAuth = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            setCurrentUser(userData);
            setAuthUserId(userData._id);
        } else {
            setAuthUserId(null);
            setCurrentUser(null);
            // Clear other data
            setPosts([]);
            setLoading(false);

            const publicPaths = ['#/', '#/login', '#/signup'];
            if (!publicPaths.includes(window.location.hash)) {
                setCurrentPath('#/');
            }
        }
        setLoading(false);
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // Fetch Posts from Backend
  useEffect(() => {
    if (!currentUser) return;

    const fetchPosts = async () => {
        try {
            const data = await api.get('/posts', currentUser.token);
            // Map MongoDB _id to frontend id
            const mappedPosts = data.map((p: any) => ({
                id: p._id,
                authorId: p.user._id,
                content: p.text,
                timestamp: new Date(p.createdAt).getTime(),
                comments: p.comments.map((c: any) => ({
                    id: c._id,
                    authorId: c.user,
                    text: c.text,
                    timestamp: new Date(c.createdAt).getTime()
                })),
                reactions: { like: p.likes }
            }));
            setPosts(mappedPosts);
        } catch (error) {
            console.error("Failed to fetch posts", error);
        }
    };

    fetchPosts();
  }, [currentUser]);

  // ... rest of the handlers
  // Posts
  const handleAddPost = async (postDetails: any) => {
      if (!currentUser) return;
      try {
          const newPost = await api.post('/posts', {
              text: postDetails.content || postDetails.text,
              image: postDetails.mediaUrls?.[0]
          }, currentUser.token);

          // Refresh posts (optimistic update could be done here instead)
          const data = await api.get('/posts', currentUser.token);
          const mappedPosts = data.map((p: any) => ({
                id: p._id,
                authorId: p.user._id,
                content: p.text,
                timestamp: new Date(p.createdAt).getTime(),
                comments: p.comments.map((c: any) => ({
                    id: c._id,
                    authorId: c.user,
                    text: c.text,
                    timestamp: new Date(c.createdAt).getTime()
                })),
                reactions: { like: p.likes }
            }));
            setPosts(mappedPosts);
      } catch (err) {
          console.error("Failed to add post", err);
      }
  };

  const handleDeletePost = async (postId: string) => {
      if (!currentUser) return;
      try {
          await api.delete(`/posts/${postId}`, currentUser.token);
          setPosts(posts.filter(p => p.id !== postId));
      } catch (err) {
          console.error("Failed to delete post", err);
      }
  };

  const handleReaction = async (postId: string, reaction: any) => {
      if (!currentUser) return;
      try {
          const updatedLikes = await api.post(`/posts/${postId}/like`, {}, currentUser.token);
          setPosts(posts.map(p => p.id === postId ? {
              ...p,
              reactions: { ...p.reactions, like: updatedLikes }
          } : p));
      } catch (err) {
          console.error("Failed to reaction", err);
      }
  };

  const handleAddComment = async (postId: string, text: string) => {
      if (!currentUser) return;
      try {
          const updatedComments = await api.post(`/posts/${postId}/comment`, { text }, currentUser.token);
          setPosts(posts.map(p => p.id === postId ? {
              ...p,
              comments: updatedComments.map((c: any) => ({
                  id: c._id,
                  authorId: c.user,
                  text: c.text,
                  timestamp: new Date(c.createdAt).getTime()
              }))
          } : p));
      } catch (err) {
          console.error("Failed to add comment", err);
      }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const commentToDelete = post.comments.find(c => c.id === commentId);
      if (commentToDelete) {
          await db.collection('posts').doc(postId).update({
              comments: FieldValue.arrayRemove(commentToDelete)
          });
      }
  };

  const handleToggleSavePost = async (postId: string) => {
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

      const newPost = {
          authorId: currentUser.id,
          content: commentary,
          timestamp: Date.now(),
          sharedPost: sharedPostInfo,
          comments: [],
          reactions: {},
          groupId: shareTarget.type === 'group' ? shareTarget.id : undefined,
          collegeId: currentUser.collegeId
      };
      await db.collection('posts').add(newPost);
  };

  const handleSharePostAsMessage = async (conversationId: string, authorName: string, postContent: string) => {
      if (!currentUser) return;
      const text = `Shared post by ${authorName}: ${postContent.substring(0, 50)}...`;
      await handleSendMessage(conversationId, text);
  };

  // Stories
  const handleAddStory = async (storyDetails: any) => {
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
      if (!currentUser) return;
      await db.collection('stories').doc(storyId).update({
          viewedBy: FieldValue.arrayUnion(currentUser.id)
      });
  };

  const handleDeleteStory = async (storyId: string) => {
      await db.collection('stories').doc(storyId).delete();
  };

  const handleReplyToStory = async (authorId: string, text: string) => {
      const conversationId = await handleCreateOrOpenConversation(authorId);
      await handleSendMessage(conversationId, text);
  };

  // Chat
  const handleCreateOrOpenConversation = async (otherUserId: string): Promise<string> => {
      if (!currentUser) throw new Error("Not logged in");
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
      const convo = conversations.find(c => c.id === conversationId);
      if (!convo) return;
      const updatedMessages = convo.messages.filter(m => !messageIds.includes(m.id));
      await db.collection('conversations').doc(conversationId).update({ messages: updatedMessages });
  };

  const handleDeleteMessagesForSelf = async (conversationId: string, messageIds: string[]) => {
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
      for (const id of conversationIds) {
          await db.collection('conversations').doc(id).delete();
      }
  };

  // Groups
  const handleCreateGroup = async (groupDetails: any) => {
      if (!currentUser) return;
      const newGroup = {
          ...groupDetails,
          creatorId: currentUser.id,
          memberIds: [currentUser.id],
          collegeId: currentUser.collegeId
      };
      await db.collection('groups').add(newGroup);
  };

  const handleJoinGroupRequest = async (groupId: string) => {
      if (!currentUser) return;
      const group = groups.find(g => g.id === groupId);
      if (group?.privacy === 'public') {
          await db.collection('groups').doc(groupId).update({ memberIds: FieldValue.arrayUnion(currentUser.id) });
      } else {
          await db.collection('groups').doc(groupId).update({ pendingMemberIds: FieldValue.arrayUnion(currentUser.id) });
      }
  };

  const handleApproveJoinRequest = async (groupId: string, userId: string) => {
      await db.collection('groups').doc(groupId).update({
          pendingMemberIds: FieldValue.arrayRemove(userId),
          memberIds: FieldValue.arrayUnion(userId)
      });
  };

  const handleDeclineJoinRequest = async (groupId: string, userId: string) => {
      await db.collection('groups').doc(groupId).update({
          pendingMemberIds: FieldValue.arrayRemove(userId)
      });
  };

  const handleToggleFollowGroup = async (groupId: string) => {
      if (!currentUser) return;
      const isFollowing = currentUser.followingGroups?.includes(groupId);
      if (isFollowing) {
          await db.collection('users').doc(currentUser.id).update({ followingGroups: FieldValue.arrayRemove(groupId) });
          await db.collection('groups').doc(groupId).update({ followers: FieldValue.arrayRemove(currentUser.id) });
      } else {
          await db.collection('users').doc(currentUser.id).update({ followingGroups: FieldValue.arrayUnion(groupId) });
          await db.collection('groups').doc(groupId).update({ followers: FieldValue.arrayUnion(currentUser.id) });
      }
  };

  const handleUpdateGroup = async (groupId: string, data: any) => {
      await db.collection('groups').doc(groupId).update(data);
  };

  const handleDeleteGroup = async (groupId: string) => {
      await db.collection('groups').doc(groupId).delete();
  };

  const handleSendGroupMessage = async (groupId: string, text: string) => {
      if (!currentUser) return;
      const newMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      await db.collection('groups').doc(groupId).update({
          messages: FieldValue.arrayUnion(newMessage)
      });
  };

  const handleRemoveGroupMember = async (groupId: string, memberId: string) => {
      await db.collection('groups').doc(groupId).update({ memberIds: FieldValue.arrayRemove(memberId) });
  };

  // Profile
  const handleAddAchievement = async (achievement: any) => {
      if (!currentUser) return;
      await db.collection('users').doc(currentUser.id).update({
          achievements: FieldValue.arrayUnion(achievement)
      });
  };

  const handleAddInterest = async (interest: string) => {
      if (!currentUser) return;
      await db.collection('users').doc(currentUser.id).update({
          interests: FieldValue.arrayUnion(interest)
      });
  };

  const handleUpdateProfile = async (updateData: any, avatarFile?: File | null) => {
      if (!currentUser) return;
      let avatarUrl = currentUser.avatarUrl;

      if (avatarFile) {
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
      if (!currentUser) return;
      await db.collection('courses').add({
          facultyId: currentUser.id, // Default to creator, but allow override
          ...courseData,
          collegeId: currentUser.collegeId,
      });
  };

  const handleUpdateCourse = async (courseId: string, data: any) => {
      await db.collection('courses').doc(courseId).update(data);
  };

  const handleDeleteCourse = async (courseId: string) => {
      await db.collection('courses').doc(courseId).delete();
  };

  const handleRequestToJoinCourse = async (courseId: string) => {
      if (!currentUser) return;
      await db.collection('courses').doc(courseId).update({
          pendingStudents: FieldValue.arrayUnion(currentUser.id)
      });
  };

  const handleUpdateCourseFaculty = async (courseId: string, newFacultyId: string) => {
      await db.collection('courses').doc(courseId).update({ facultyId: newFacultyId });
  };

  // Notices
  const handleCreateNotice = async (noticeData: any) => {
      if (!currentUser) return;
      await db.collection('notices').add({
          ...noticeData,
          authorId: currentUser.id,
          collegeId: currentUser.collegeId,
          timestamp: Date.now()
      });
  };

  const handleDeleteNotice = async (noticeId: string) => {
      await db.collection('notices').doc(noticeId).delete();
  };

  // Admin/HOD User Management
  const handleCreateUser = async (userData: any, password?: string) => {
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
      await db.collection('users').doc(userId).update({ isApproved: true });
  };

  const handleDeclineTeacherRequest = async (userId: string) => {
      await db.collection('users').doc(userId).delete();
  };

  const handleApproveHodRequest = async (userId: string) => {
      await db.collection('users').doc(userId).update({ isApproved: true });
  };

  const handleDeclineHodRequest = async (userId: string) => {
      await db.collection('users').doc(userId).delete();
  };

  const onDeleteUser = async (userId: string) => {
      await db.collection('users').doc(userId).delete();
  };

  const onToggleFreezeUser = async (userId: string) => {
      const user = users[userId];
      await db.collection('users').doc(userId).update({ isFrozen: !user.isFrozen });
  };

  const onUpdateUserRole = async (userId: string, updateData: { tag: UserTag, department: string }) => {
      await db.collection('users').doc(userId).update(updateData);
  }

  // Super Admin
  const handleCreateCollegeAdmin = async (collegeName: string, email: string, password: string) => {
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
              requestedCollegeName: FieldValue.delete()
          });

          alert("Director approved and college created successfully.");
      } catch (error: any) {
          console.error("Approval failed:", error);
          alert("Approval failed: " + error.message);
      }
  };

  // College Management
  const onUpdateCollegeDepartments = async (collegeId: string, departments: string[]) => {
      await db.collection('colleges').doc(collegeId).update({ departments });
  };

  const onUpdateCollegeClasses = async (collegeId: string, department: string, classes: any) => {
      await db.collection('colleges').doc(collegeId).update({
          [`classes.${department}`]: classes
      });
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
      await db.collection('users').doc(currentUser.id).update({
          personalNotes: FieldValue.arrayUnion(newNote)
      });
  };

  const handleUpdateNote = async (noteId: string, title: string, content: string) => {
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.map(n =>
          n.id === noteId ? { ...n, title, content, timestamp: Date.now() } : n
      );
      await db.collection('users').doc(currentUser.id).update({ personalNotes: updatedNotes });
  };

  const handleDeleteNote = async (noteId: string) => {
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.filter(n => n.id !== noteId);
      await db.collection('users').doc(currentUser.id).update({ personalNotes: updatedNotes });
  };

  // Course management
  const handleAddNote = async (courseId: string, note: { title: string, fileUrl: string, fileName: string }) => {
      await db.collection('courses').doc(courseId).update({
          notes: FieldValue.arrayUnion({ ...note, id: Date.now().toString(), uploadedAt: Date.now() })
      });
  };

  const handleAddAssignment = async (courseId: string, assignment: { title: string, fileUrl: string, fileName: string, dueDate: number }) => {
      await db.collection('courses').doc(courseId).update({
          assignments: FieldValue.arrayUnion({ ...assignment, id: Date.now().toString(), postedAt: Date.now() })
      });
  };

  const handleTakeAttendance = async (courseId: string, record: AttendanceRecord) => {
      await db.collection('courses').doc(courseId).update({
          attendanceRecords: FieldValue.arrayUnion(record)
      });
  };

  const handleManageCourseRequest = async (courseId: string, studentId: string, action: 'approve' | 'reject') => {
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
      await db.collection('courses').doc(courseId).update({
          students: FieldValue.arrayUnion(...studentIds)
      });
  };

  const handleRemoveStudentFromCourse = async (courseId: string, studentId: string) => {
      await db.collection('courses').doc(courseId).update({
          students: FieldValue.arrayRemove(studentId)
      });
  };

  const handleSendCourseMessage = async (courseId: string, text: string) => {
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
      if (!currentUser) return;
      await db.collection('courses').doc(courseId).update({
          [`personalNotes.${currentUser.id}`]: note
      });
  };

  const handleSaveFeedback = async (courseId: string, rating: number, comment: string) => {
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
                const post = posts.find(p => p.id === eid);
                if (post) {
                    const attendees = post.eventDetails?.attendees || [];
                    if (!attendees.includes(currentUser.id)) {
                        await db.collection('posts').doc(eid).update({
                            'eventDetails.attendees': FieldValue.arrayUnion(currentUser.id)
                        });
                    }
                }
            }}
            onUnregister={async (eid) => {
                 await db.collection('posts').doc(eid).update({
                    'eventDetails.attendees': FieldValue.arrayRemove(currentUser.id)
                });
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

  const handleLogout = () => {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
  };

  // Default Fallback
  return (
      <HomePage
        currentUser={currentUser}
        users={users}
        posts={posts}
        stories={stories}
        groups={groups}
        events={posts.filter(p => p.isEvent)}
        notices={notices}
        onNavigate={setCurrentPath}
        onLogout={handleLogout}
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
  );
};

export default App;
