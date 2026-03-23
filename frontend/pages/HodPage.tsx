
import React, { useState, useMemo, useEffect } from 'react';
import { User, Course, Notice, College, UserTag } from '../types';
import { logout } from '../utils/authUtils';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import CreateSingleUserModal from '../components/CreateSingleUserModal';
import AddStudentsCsvModal from '../components/AddStudentsCsvModal';
import AddTeachersCsvModal from '../components/AddTeachersCsvModal';
import { auth } from '../firebase';
import {
    ChartPieIcon, UsersIcon, BookOpenIcon, MegaphoneIcon, ChartBarIcon,
    SettingsIcon, PlusIcon, SearchIcon, FilterIcon, TrashIcon,
    CheckCircleIcon, AlertTriangleIcon, ClockIcon, ArrowRightIcon,
    MenuIcon, CloseIcon, ChevronRightIcon, ChevronDownIcon, FileTextIcon,
    UserPlusIcon, EditIcon, LogOutIcon, CalendarIcon, ClipboardCheckIcon,
    BuildingIcon, XCircleIcon
} from '../components/Icons';
import type { TimetableSlot } from '../types';

interface HodPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  isViewingAsDirector?: boolean;
  courses: Course[];
  onCreateCourse: (courseData: Omit<Course, 'id'>) => void;
  onUpdateCourse: (courseId: string, data: any) => void;
  onDeleteCourse: (courseId: string) => void;
  notices: Notice[];
  users: { [key: string]: User };
  allUsers: User[];
  onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
  onDeleteNotice: (noticeId: string) => void;
  departmentChats: any[];
  onSendDepartmentMessage: (department: string, channel: string, text: string) => void;
  onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
  onCreateUsersBatch: (usersData: Omit<User, 'id'>[]) => Promise<{ successCount: number; errors: any[] }>;
  onApproveTeacherRequest: (teacherId: string) => void;
  onDeclineTeacherRequest: (teacherId: string) => void;
  colleges: College[];
  onUpdateCourseFaculty: (courseId: string, newFacultyId: string) => void;
  onUpdateCollegeClasses: (collegeId: string, department: string, classes: any) => void;
  onDeleteUser: (userId: string) => void;
  onToggleFreezeUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, updateData: { tag: UserTag, department: string }) => void;
}

const SidebarItem: React.FC<{ id: string; label: string; icon: React.ElementType; onClick: () => void; active: boolean }> = ({ id, label, icon: Icon, onClick, active }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[0.5rem] transition-all duration-200 ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}
    >
        <Icon className={`w-5 h-5 ${active ? 'opacity-100' : 'opacity-70'}`} />
        <span className="font-bold text-sm tracking-tight">{label}</span>
        {active && <ChevronRightIcon className="w-4 h-4 ml-auto opacity-70" />}
    </button>
);

const StatCard: React.FC<{
    label: string;
    value: number | string;
    icon: React.ElementType;
    iconBgClass: string;
    trend?: 'up' | 'down';
    subText?: string;
}> = ({ label, value, icon: Icon, iconBgClass, trend, subText }) => (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center justify-between hover:shadow-md transition-all duration-300 group">
        <div className="space-y-1">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-[0.1em]">{label}</p>
            <div className="flex items-center gap-2">
                <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{value}</p>
                {trend && (
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {trend === 'up' ? <ArrowRightIcon className="w-3.5 h-3.5 -rotate-45" /> : <ArrowRightIcon className="w-3.5 h-3.5 rotate-45" />}
                    </div>
                )}
            </div>
            {subText && <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{subText}</p>}
        </div>
        <div className={`w-14 h-14 rounded-[0.75rem] flex items-center justify-center ${iconBgClass} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-7 h-7" />
        </div>
    </div>
);

const CreateClassModal = ({ onClose, onCreateClass }: any) => {
    const [year, setYear] = useState('');
    const [division, setDivision] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(year && division) {
            onCreateClass({ year: parseInt(year), division });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4">Create New Class</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Year / Standard</label>
                        <input type="number" min="1" max="5" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" placeholder="e.g. 2" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Division</label>
                        <input type="text" value={division} onChange={e => setDivision(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" placeholder="e.g. A" required/>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Create Class</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddSubjectModal = ({ onClose, onAddSubject, year, division, faculty }: any) => {
    const [subjectName, setSubjectName] = useState('');
    const [facultyId, setFacultyId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(subjectName) {
            onAddSubject({ subject: subjectName, facultyId, year, division });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4">Add Subject to Class {year}-{division}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Subject Name</label>
                        <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" placeholder="e.g. Mathematics" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Assign Faculty (Optional)</label>
                        <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1">
                            <option value="">Select Faculty</option>
                            {faculty.map((f: User) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} {f.tag !== 'Teacher' ? `(${f.tag === 'HOD/Dean' ? 'HOD' : f.tag})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Add Subject</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditSubjectModal = ({ onClose, onUpdate, course, faculty }: any) => {
    const [subjectName, setSubjectName] = useState(course.subject);
    const [facultyId, setFacultyId] = useState(course.facultyId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(subjectName) {
            onUpdate(course.id, { subject: subjectName, facultyId });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4">Edit Subject</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Subject Name</label>
                        <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Assign Faculty</label>
                        <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1">
                            <option value="">Unassigned</option>
                            {faculty.map((f: User) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} {f.tag !== 'Teacher' ? `(${f.tag === 'HOD/Dean' ? 'HOD' : f.tag})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CreateNoticeModal = ({ onClose, onCreateNotice }: any) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaDataUrl, setMediaDataUrl] = useState<string | undefined>();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaDataUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateNotice({ title, content, mediaDataUrl, mediaType: mediaDataUrl ? 'image' : undefined });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-md border border-border">
                <h2 className="text-xl font-bold mb-4">Create Department Notice</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-2 border border-border rounded bg-input text-foreground" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                    <textarea className="w-full p-2 border border-border rounded bg-input text-foreground" placeholder="Content" value={content} onChange={e => setContent(e.target.value)} required rows={4} />

                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm bg-muted px-3 py-1.5 rounded-lg font-bold hover:bg-muted/80">Add Image</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        {mediaDataUrl && <span className="text-xs text-emerald-500 font-bold">Image selected!</span>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground font-bold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold">Post</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DashboardHome = ({ stats, recentActivity, alerts }: any) => (
    <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Students" value={stats.studentCount} icon={UsersIcon} iconBgClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" trend="up" subText="Active Learners" />
            <StatCard label="Core Faculty" value={stats.facultyCount} icon={UserPlusIcon} iconBgClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" trend="up" subText="Academic Staff" />
            <StatCard label="Active Classes" value={stats.classCount} icon={BookOpenIcon} iconBgClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" subText="Managed Divisions" />
            <StatCard label="Avg Attendance" value={`${stats.avgAttendance}%`} icon={ChartPieIcon} iconBgClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20" subText="Institutional KPI" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-muted-foreground"/> Recent Activity</h3>
                <div className="space-y-4">
                    {recentActivity.map((act: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors">
                            <div className={`p-2 rounded-full ${act.type === 'notice' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {act.type === 'notice' ? <MegaphoneIcon className="w-4 h-4"/> : <BookOpenIcon className="w-4 h-4"/>}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{act.title}</p>
                                <p className="text-xs text-muted-foreground">{act.time}</p>
                            </div>
                        </div>
                    ))}
                    {recentActivity.length === 0 && <p className="text-muted-foreground text-sm">No recent activity.</p>}
                </div>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5 text-red-500"/> Alerts</h3>
                <div className="space-y-3">
                    {alerts.map((alert: any, i: number) => (
                        <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg text-sm text-red-800 dark:text-red-300">
                            {alert}
                        </div>
                    ))}
                    {alerts.length === 0 && <p className="text-muted-foreground text-sm">No alerts. Good job!</p>}
                </div>
            </div>
        </div>
    </div>
);

const UserDirectory = ({
    users,
    type,
    onCreateUser,
    onCreateUsersBatch,
    department,
    activeCourses
}: {
    users: User[],
    type: 'Student' | 'Teacher',
    onCreateUser: any,
    onCreateUsersBatch: any,
    department: string,
    activeCourses: Course[]
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeYears = useMemo(() => {
        const years = new Set<number>();
        activeCourses.forEach(c => years.add(c.year));
        return Array.from(years).sort((a, b) => a - b);
    }, [activeCourses]);

    const groupedStudents = useMemo(() => {
        if (type !== 'Student') return {};
        const groups: { [key: number]: User[] } = {};

        activeYears.forEach(y => groups[y] = []);
        groups[0] = [];

        filteredUsers.forEach(u => {
            const y = u.yearOfStudy || 0;
            if (!groups[y]) groups[y] = [];
            groups[y].push(u);
        });

        Object.keys(groups).forEach(key => {
            groups[parseInt(key)].sort((a, b) => {
                const rollA = parseInt(a.rollNo || '0') || 0;
                const rollB = parseInt(b.rollNo || '0') || 0;
                return rollA - rollB;
            });
        });

        return groups;
    }, [filteredUsers, type, activeYears]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={`Search ${type}s...`}
                        className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsBulkModalOpen(true)} className="flex-1 sm:flex-none bg-card border border-border hover:bg-muted text-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        <FileTextIcon className="w-4 h-4"/> Bulk Upload
                    </button>
                    <button onClick={() => setIsSingleModalOpen(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                        <PlusIcon className="w-4 h-4"/> Add {type}
                    </button>
                </div>
            </div>

            {type === 'Student' ? (
                <div className="space-y-8">
                    {activeYears.length === 0 && groupedStudents[0]?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                            No students or classes found. Create classes first to group students.
                        </div>
                    )}

                    {activeYears.map(year => (
                        <div key={year} className="bg-card rounded-xl border border-border overflow-hidden">
                            <div className="bg-muted/30 px-6 py-3 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-foreground">Year {year}</h3>
                                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    {groupedStudents[year]?.length || 0} Students
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/10 text-muted-foreground font-semibold border-b border-border">
                                        <tr>
                                            <th className="p-4 w-24">Roll No</th>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Division</th>
                                            <th className="p-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {groupedStudents[year]?.map((user: User) => (
                                            <tr key={user.id} className="hover:bg-muted/20">
                                                <td className="p-4 font-mono text-xs">{user.rollNo || '-'}</td>
                                                <td className="p-4 flex items-center gap-3">
                                                    <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                    <span className="font-medium">{user.name}</span>
                                                </td>
                                                <td className="p-4 text-muted-foreground">{user.email}</td>
                                                <td className="p-4">{user.division || '-'}</td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {user.isFrozen ? 'Suspended' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!groupedStudents[year] || groupedStudents[year].length === 0) && (
                                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">No students in this year yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {/* Unassigned Students */}
                    {groupedStudents[0]?.length > 0 && (
                        <div className="bg-card rounded-xl border border-border overflow-hidden mt-8">
                            <div className="bg-muted/30 px-6 py-3 border-b border-border">
                                <h3 className="font-bold text-foreground">Unassigned / Other</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-border">
                                    {groupedStudents[0].map((user: User) => (
                                        <tr key={user.id} className="hover:bg-muted/20">
                                            <td className="p-4 font-mono text-xs">{user.rollNo || '-'}</td>
                                            <td className="p-4 flex items-center gap-3">
                                                <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                <span className="font-medium">{user.name}</span>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{user.email}</td>
                                            <td className="p-4">{user.division || '-'}</td>
                                            <td className="p-4 text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {user.isFrozen ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Assigned Classes</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map(user => {
                                const assignedCourses = activeCourses.filter(c => c.facultyId === user.id);
                                const isExpanded = expandedFacultyId === user.id;
                                return (
                                    <React.Fragment key={user.id}>
                                        <tr className={`hover:bg-muted/20 cursor-pointer ${isExpanded ? 'bg-muted/10' : ''}`} onClick={() => setExpandedFacultyId(isExpanded ? null : user.id)}>
                                            <td className="p-4 flex items-center gap-3">
                                                <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                <span className="font-semibold">{user.name}</span>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{user.email}</td>
                                            <td className="p-4">
                                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                                                    {assignedCourses.length} Courses
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <ChevronDownIcon className={`w-4 h-4 inline-block transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-muted/5">
                                                <td colSpan={4} className="p-4">
                                                    <div className="pl-12">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Teaching Schedule</p>
                                                        {assignedCourses.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {assignedCourses.map(c => (
                                                                    <div key={c.id} className="bg-card border border-border p-2 rounded-lg text-xs flex justify-between">
                                                                        <span className="font-bold">{c.subject}</span>
                                                                        <span className="text-muted-foreground">Class {c.year}-{c.division}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No active courses assigned.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isSingleModalOpen && <CreateSingleUserModal isOpen={isSingleModalOpen} onClose={() => setIsSingleModalOpen(false)} department={department} role={type} onCreateUser={onCreateUser} />}
            {isBulkModalOpen && type === 'Student' && <AddStudentsCsvModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} department={department} onCreateUsersBatch={onCreateUsersBatch} />}
            {isBulkModalOpen && type === 'Teacher' && <AddTeachersCsvModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} department={department} onCreateUsersBatch={onCreateUsersBatch} />}
        </div>
    );
};

const AcademicsView = ({
    activeClasses,
    deptCourses,
    deptStudents,
    onCreateClass,
    onAddSubject,
    onDeleteCourse,
    faculty,
    onUpdateCourse
}: any) => {
    const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
    const [yearFilter, setYearFilter] = useState<number | 'All'>('All');
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const filteredClasses = yearFilter === 'All'
        ? activeClasses
        : activeClasses.filter((cls: any) => cls.year === yearFilter);

    if (selectedClass) {
        const classCourses = deptCourses.filter((c: Course) => c.year === selectedClass.year && c.division === selectedClass.division);

        const classStudents = deptStudents.filter((s: User) => s.yearOfStudy === selectedClass.year && s.division === selectedClass.division)
            .sort((a: User, b: User) => (parseInt(a.rollNo || '0') || 0) - (parseInt(b.rollNo || '0') || 0));

        return (
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedClass(null)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRightIcon className="w-5 h-5 rotate-180"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Class {selectedClass.year}-{selectedClass.division}</h2>
                        <p className="text-sm text-muted-foreground">{classCourses.length} Subjects • {classStudents.length} Students</p>
                    </div>
                    <button
                        onClick={() => setIsAddSubjectModalOpen(true)}
                        className="ml-auto bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90"
                    >
                        <PlusIcon className="w-4 h-4"/> Add Subject
                    </button>
                </div>

                {/* Subjects Grid */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2"><BookOpenIcon className="w-5 h-5 text-blue-500"/> Subjects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classCourses.map((course: Course) => {
                            const assignedFaculty = faculty.find((f: User) => f.id === course.facultyId);
                            return (
                                <div key={course.id} className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-foreground">{course.subject}</h4>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditingCourse(course)} className="text-muted-foreground hover:text-primary p-1">
                                                <EditIcon className="w-4 h-4"/>
                                            </button>
                                            <button onClick={() => { if(window.confirm('Delete this subject?')) onDeleteCourse(course.id) }} className="text-muted-foreground hover:text-destructive p-1">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-border">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">Faculty</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {assignedFaculty ? (
                                                <>
                                                    <Avatar src={assignedFaculty.avatarUrl} name={assignedFaculty.name} size="xs"/>
                                                    <span className="text-sm font-medium">{assignedFaculty.name} {assignedFaculty.tag !== 'Teacher' ? `(${assignedFaculty.tag === 'HOD/Dean' ? 'HOD' : assignedFaculty.tag})` : ''}</span>
                                                </>
                                            ) : <span className="text-sm text-muted-foreground italic">Unassigned</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {classCourses.length === 0 && (
                            <div className="col-span-full text-center py-8 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                                No subjects added yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Students List */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-emerald-500"/>
                        <h3 className="font-bold text-lg text-foreground">Students ({classStudents.length})</h3>
                    </div>
                    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground font-bold border-b border-border">
                                <tr>
                                    <th className="p-4 w-24">Roll No</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {classStudents.map((s: User) => (
                                    <tr key={s.id} className="hover:bg-muted/10">
                                        <td className="p-4 font-mono">{s.rollNo || '-'}</td>
                                        <td className="p-4 flex items-center gap-3">
                                            <Avatar src={s.avatarUrl} name={s.name} size="sm"/>
                                            <span className="font-medium">{s.name}</span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{s.email}</td>
                                        <td className="p-4 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${s.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {s.isFrozen ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {classStudents.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No students assigned to this class div.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isAddSubjectModalOpen && <AddSubjectModal onClose={() => setIsAddSubjectModalOpen(false)} onAddSubject={onAddSubject} year={selectedClass.year} division={selectedClass.division} faculty={faculty} />}
                {editingCourse && <EditSubjectModal onClose={() => setEditingCourse(null)} onUpdate={onUpdateCourse} course={editingCourse} faculty={faculty} />}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-foreground">Class Management</h2>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                        className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="All">All Years</option>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => setIsCreateClassModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="w-4 h-4"/> Create Class
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls: any, idx: number) => {
                    const studentCount = deptStudents.filter((s: User) => s.yearOfStudy === cls.year && s.division === cls.division).length;
                    const subjectCount = deptCourses.filter((c: Course) => c.year === cls.year && c.division === cls.division).length;

                    return (
                        <div
                            key={`${cls.year}-${cls.division}-${idx}`}
                            className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                            onClick={() => setSelectedClass(cls)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <BookOpenIcon className="w-6 h-6"/>
                                </div>
                                <div className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
                                    {subjectCount} Subjects
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Class {cls.year}-{cls.division}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{studentCount} Students Enrolled</p>

                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                <span className="text-xs font-bold text-primary group-hover:underline">Manage Subjects & Students</span>
                                <ChevronRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"/>
                            </div>
                        </div>
                    )
                })}
                {filteredClasses.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border border-dashed">
                        <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-20"/>
                        <p className="text-lg font-medium">No classes found.</p>
                        <p className="text-sm">Create a class to start managing subjects.</p>
                    </div>
                )}
            </div>

            {isCreateClassModalOpen && <CreateClassModal onClose={() => setIsCreateClassModalOpen(false)} onCreateClass={onCreateClass} />}
        </div>
    );
};

const AddSlotModal = ({ onClose, onAddSlot, courses }: { onClose: () => void, onAddSlot: (courseId: string, slot: TimetableSlot) => void, courses: Course[] }) => {
    const [courseId, setCourseId] = useState(courses[0]?.id || '');
    const [day, setDay] = useState<TimetableSlot['day']>('Monday');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [room, setRoom] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(courseId && day && startTime && endTime && room) {
            onAddSlot(courseId, { day, startTime, endTime, room });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4">Add Timetable Slot</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Subject</label>
                        <select value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1">
                            {courses.map(c => <option key={c.id} value={c.id}>{c.subject}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Day</label>
                        <select value={day} onChange={e => setDay(e.target.value as any)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground">Start Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" required/>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground">End Time</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" required/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Room / Lab</label>
                        <input type="text" value={room} onChange={e => setRoom(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" placeholder="e.g. Room 301" required/>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Add Slot</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddTimetableCsvModal = ({ isOpen, onClose, courses, onUpdateCourse, selectedClass }: any) => {
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const header = lines.shift()?.toLowerCase().split(',');

            if (!header?.includes('subject') || !header?.includes('day') || !header?.includes('start')) {
                alert("CSV must have 'Subject', 'Day', 'Start', 'End', and 'Room' columns.");
                return;
            }

            const subIdx = header.indexOf('subject');
            const dayIdx = header.indexOf('day');
            const startIdx = header.indexOf('start');
            const endIdx = header.indexOf('end');
            const roomIdx = header.indexOf('room');

            const data = lines.map(line => {
                const vals = line.split(',');
                return {
                    subject: vals[subIdx]?.trim(),
                    day: vals[dayIdx]?.trim(),
                    startTime: vals[startIdx]?.trim(),
                    endTime: vals[endIdx]?.trim(),
                    room: vals[roomIdx]?.trim()
                };
            });
            setParsedData(data);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            for (const row of parsedData) {
                const course = courses.find((c: any) => c.subject.toLowerCase() === row.subject.toLowerCase());
                if (course) {
                    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    const day = validDays.find(d => d.toLowerCase() === row.day.toLowerCase());
                    if (day) {
                        const updatedSlots = [...(course.slots || []), {
                            day,
                            startTime: row.startTime,
                            endTime: row.endTime,
                            room: row.room
                        }];
                        await onUpdateCourse(course.id, { slots: updatedSlots });
                    }
                }
            }
            onClose();
        } catch (err) {
            alert("Error uploading timetable");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Bulk Upload Timetable (Class {selectedClass.year}-{selectedClass.division})</h2>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5"/></button>
                </div>

                <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>

                {parsedData.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border border-border rounded-lg mb-4">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    <th className="p-2">Subject</th>
                                    <th className="p-2">Day</th>
                                    <th className="p-2">Time</th>
                                    <th className="p-2">Room</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {parsedData.map((row, i) => (
                                    <tr key={i}>
                                        <td className="p-2">{row.subject}</td>
                                        <td className="p-2">{row.day}</td>
                                        <td className="p-2">{row.startTime} - {row.endTime}</td>
                                        <td className="p-2">{row.room}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || parsedData.length === 0}
                        className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg disabled:opacity-50"
                    >
                        {isLoading ? 'Uploading...' : `Upload ${parsedData.length} Slots`}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TimetableView = ({ courses, activeClasses, onUpdateCourse }: { courses: Course[], activeClasses: {year: number, division: string}[], onUpdateCourse: (id: string, data: any) => void }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [selectedClass, setSelectedClass] = useState(activeClasses[0] || null);
    const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    const filteredCourses = courses.filter(c =>
        selectedClass && c.year === selectedClass.year && c.division === selectedClass.division
    );

    const handleAddSlot = (courseId: string, slot: TimetableSlot) => {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const updatedSlots = [...(course.slots || []), slot];
            onUpdateCourse(courseId, { slots: updatedSlots });
        }
    };

    const handleDeleteSlot = (courseId: string, slotIndex: number) => {
        const course = courses.find(c => c.id === courseId);
        if (course && course.slots) {
            const updatedSlots = course.slots.filter((_, i) => i !== slotIndex);
            onUpdateCourse(courseId, { slots: updatedSlots });
        }
    };

    const timetableData: { [key: string]: (TimetableSlot & { subject: string, courseId: string, slotIndex: number })[] } = {};
    days.forEach(d => timetableData[d] = []);

    filteredCourses.forEach(course => {
        course.slots?.forEach((slot, index) => {
            if (timetableData[slot.day]) {
                timetableData[slot.day].push({ ...slot, subject: course.subject, courseId: course.id, slotIndex: index });
            }
        });
    });

    Object.keys(timetableData).forEach(day => {
        timetableData[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-foreground">Class Timetable</h2>
                    <select
                        value={selectedClass ? `${selectedClass.year}-${selectedClass.division}` : ''}
                        onChange={(e) => {
                            const [year, div] = e.target.value.split('-');
                            setSelectedClass({ year: parseInt(year), division: div });
                        }}
                        className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {activeClasses.map((cls, idx) => (
                            <option key={idx} value={`${cls.year}-${cls.division}`}>Class {cls.year}-{cls.division}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="bg-card border border-border px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-muted"
                    >
                        <FileTextIcon className="w-4 h-4"/> Bulk Upload
                    </button>
                    <button
                        onClick={() => setIsAddSlotModalOpen(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90"
                    >
                        <PlusIcon className="w-4 h-4"/> Add Slot
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {days.map(day => (
                    <div key={day} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="bg-muted/30 px-4 py-2 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-foreground">{day}</h3>
                            <span className="text-xs font-bold text-muted-foreground">{timetableData[day].length} Sessions</span>
                        </div>
                        <div className="p-4 space-y-3">
                            {timetableData[day].map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-muted/10 rounded-lg border border-border group relative">
                                    <div className="flex flex-col items-center justify-center min-w-[80px] py-1 bg-primary/5 rounded-md border border-primary/10">
                                        <span className="text-xs font-bold text-primary">{slot.startTime}</span>
                                        <span className="text-[10px] text-muted-foreground">{slot.endTime}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-foreground">{slot.subject}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <BuildingIcon className="w-3 h-3"/> Room: {slot.room}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSlot(slot.courseId, slot.slotIndex)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                            {timetableData[day].length === 0 && (
                                <p className="text-center py-4 text-xs text-muted-foreground italic">No classes scheduled.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {isAddSlotModalOpen && (
                <AddSlotModal
                    onClose={() => setIsAddSlotModalOpen(false)}
                    onAddSlot={handleAddSlot}
                    courses={filteredCourses}
                />
            )}
            {isBulkModalOpen && (
                <AddTimetableCsvModal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    courses={filteredCourses}
                    onUpdateCourse={onUpdateCourse}
                    selectedClass={selectedClass}
                />
            )}
        </div>
    );
};

const ApprovalsView = ({ pendingUsers, onApprove, onDecline }: any) => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-foreground">Pending Faculty Registrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((user: User) => (
                <div key={user.id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar src={user.avatarUrl} name={user.name} size="md"/>
                        <div>
                            <h4 className="font-bold text-foreground">{user.name}</h4>
                            <p className="text-xs text-muted-foreground">{user.tag} • {user.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => onApprove(user.id)}
                            className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                        >
                            <CheckCircleIcon className="w-3 h-3"/> Approve
                        </button>
                        <button
                            onClick={() => onDecline(user.id)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                        >
                            <XCircleIcon className="w-3 h-3"/> Reject
                        </button>
                    </div>
                </div>
            ))}
            {pendingUsers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-50"/>
                    <p>No pending teacher requests.</p>
                </div>
            )}
        </div>
    </div>
);

const HodPage: React.FC<HodPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, isViewingAsDirector, courses, onCreateCourse, notices, users, allUsers, onCreateNotice, onDeleteNotice, onCreateUser, onCreateUsersBatch, onUpdateCourseFaculty, colleges, onUpdateCollegeClasses, onDeleteCourse, onUpdateCourse, onApproveTeacherRequest, onDeclineTeacherRequest } = props;

    const [activeSection, setActiveSection] = useState<'dashboard' | 'academics' | 'faculty' | 'students' | 'timetable' | 'notices' | 'approvals' | 'settings'>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Hooks moved to top
    const college = useMemo(() => colleges.find(c => c.id === currentUser.collegeId), [colleges, currentUser.collegeId]);
    const myDept = currentUser.department;

    const deptCourses = useMemo(() => {
        if (!college) return [];
        return courses.filter(c => c.department === myDept && c.collegeId === college.id);
    }, [courses, myDept, college]);

    const deptFaculty = useMemo(() => {
        if (!college) return [];
        return allUsers.filter(u => u.tag === 'Teacher' && u.department === myDept && u.collegeId === college.id);
    }, [allUsers, myDept, college]);

    const deptStudents = useMemo(() => {
        if (!college) return [];
        return allUsers.filter(u => u.tag === 'Student' && u.department === myDept && u.collegeId === college.id);
    }, [allUsers, myDept, college]);

    const teachingStaff = useMemo(() => {
        if (!college) return [];
        return allUsers.filter(u =>
            u.collegeId === college.id && (
                (u.tag === 'Teacher' && u.department === myDept) ||
                (u.tag === 'HOD/Dean' && u.department === myDept) ||
                (u.tag === 'Director')
            )
        );
    }, [allUsers, college, myDept]);

    const activeClasses = useMemo(() => {
        if (!college) return [];
        const deptClassesRaw = college.classes?.[myDept] || {};
        const classes: { year: number; division: string }[] = [];
        Object.entries(deptClassesRaw).forEach(([year, divs]) => {
            (divs as string[]).forEach(div => classes.push({ year: parseInt(year), division: div }));
        });
        return classes;
    }, [college, myDept]);

    const stats = {
        studentCount: deptStudents.length,
        facultyCount: deptFaculty.length,
        classCount: activeClasses.length,
        avgAttendance: 85 // Placeholder
    };

    const handleLogout = () => { logout(onNavigate); };

    const handleCreateClass = (data: { year: number; division: string }) => {
        if (!college) return;
        const currentClasses = college.classes?.[myDept] || {};
        const yearClasses = currentClasses[data.year] || [];
        if (!yearClasses.includes(data.division)) {
            const updatedClasses = {
                ...currentClasses,
                [data.year]: [...yearClasses, data.division].sort()
            };
            onUpdateCollegeClasses(college.id, myDept, updatedClasses);
        } else {
            alert("Class already exists!");
        }
    };

    const handleAddSubject = (data: { subject: string; facultyId: string; year: number; division: string }) => {
        if (!college) return;
        onCreateCourse({
            subject: data.subject,
            department: myDept,
            year: data.year,
            division: data.division,
            collegeId: college.id,
            facultyId: data.facultyId || ''
        });
    };

    // Timeout for loading
    useEffect(() => {
        if (currentUser.collegeId && !college) {
            const timer = setTimeout(() => setLoadingTimeout(true), 8000); // 8 seconds timeout
            return () => clearTimeout(timer);
        } else {
            setLoadingTimeout(false);
        }
    }, [college, currentUser.collegeId]);

    // --- Render Logic ---

    if (!currentUser.collegeId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-destructive/30 p-10 max-w-md text-center">
                    <AlertTriangleIcon className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">Account Configuration Error</h1>
                    <p className="text-muted-foreground mb-6">
                        Your account is not associated with any college. This usually happens if the invite was not set up correctly.
                    </p>
                    <button onClick={handleLogout} className="w-full py-3 font-bold text-primary-foreground bg-destructive rounded-xl hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2">
                        <LogOutIcon className="w-4 h-4"/> Sign Out
                    </button>
                </div>
            </div>
        );
    }

    if (currentUser.isApproved === false) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-border p-10 max-w-lg text-center">
                    <ClockIcon className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-bold text-foreground mb-4">Approval Pending</h1>
                    <p className="text-muted-foreground mb-8">Your HOD account is currently under review by the Director. You will receive access once approved.</p>
                    <button onClick={handleLogout} className="w-full py-3 font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">Sign Out</button>
                </div>
            </div>
        );
    }

    if (!college) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                {loadingTimeout ? (
                    <div className="bg-card p-8 rounded-2xl border border-border shadow-lg text-center max-w-md">
                        <AlertTriangleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4"/>
                        <h3 className="text-xl font-bold text-foreground mb-2">College Data Not Found</h3>
                        <p className="text-muted-foreground mb-6">
                            We couldn't load your college data. This might be due to a network issue or if the college has been deleted.
                        </p>
                        <button onClick={handleLogout} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
                        <p className="text-muted-foreground font-medium">Loading dashboard resources...</p>
                        <button onClick={handleLogout} className="text-sm text-primary hover:underline font-bold mt-4">
                            Taking too long? Sign Out
                        </button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen flex flex-col">
            {isViewingAsDirector && (
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex justify-between items-center z-50">
                    <p className="text-xs font-bold text-primary flex items-center gap-2">
                        <ChartPieIcon className="w-4 h-4"/>
                        Viewing HOD Dashboard for {myDept}
                    </p>
                    <button
                        onClick={() => onNavigate('#/director')}
                        className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
                    >
                        Return to Director Panel
                    </button>
                </div>
            )}
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />

            <div className="md:hidden bg-background border-b border-border p-4 flex justify-between items-center sticky top-16 z-30">
                <span className="font-bold text-lg capitalize text-foreground">{activeSection}</span>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-muted text-foreground"><MenuIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden w-full relative">
                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 md:hidden">
                            <h2 className="text-xl font-bold text-foreground">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)}><CloseIcon className="w-6 h-6 text-muted-foreground" /></button>
                        </div>
                        <div className="space-y-2">
                            <SidebarItem id="dashboard" label="Dashboard" icon={ChartPieIcon} onClick={() => {setActiveSection('dashboard'); setMobileMenuOpen(false);}} active={activeSection === 'dashboard'} />
                            <SidebarItem id="academics" label="Academics & Classes" icon={BookOpenIcon} onClick={() => {setActiveSection('academics'); setMobileMenuOpen(false);}} active={activeSection === 'academics'} />
                            <SidebarItem id="timetable" label="Class Timetable" icon={CalendarIcon} onClick={() => {setActiveSection('timetable'); setMobileMenuOpen(false);}} active={activeSection === 'timetable'} />
                            <div className="pt-4 pb-2 border-t border-slate-100 dark:border-slate-800" />
                            <SidebarItem id="faculty" label="Faculty Register" icon={UserPlusIcon} onClick={() => {setActiveSection('faculty'); setMobileMenuOpen(false);}} active={activeSection === 'faculty'} />
                            <SidebarItem id="students" label="Student Database" icon={UsersIcon} onClick={() => {setActiveSection('students'); setMobileMenuOpen(false);}} active={activeSection === 'students'} />
                            <SidebarItem id="approvals" label="Verification Tasks" icon={ClipboardCheckIcon} onClick={() => {setActiveSection('approvals'); setMobileMenuOpen(false);}} active={activeSection === 'approvals'} />
                            <div className="pt-4 pb-2 border-t border-slate-100 dark:border-slate-800" />
                            <SidebarItem id="notices" label="Department Notices" icon={MegaphoneIcon} onClick={() => {setActiveSection('notices'); setMobileMenuOpen(false);}} active={activeSection === 'notices'} />
                            <SidebarItem id="settings" label="Dept Settings" icon={SettingsIcon} onClick={() => {setActiveSection('settings'); setMobileMenuOpen(false);}} active={activeSection === 'settings'} />
                        </div>
                    </div>
                </aside>

                {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-112px)] md:h-[calc(100vh-64px)] bg-muted/10 pb-32 lg:pb-8">

                    {activeSection === 'dashboard' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">{myDept}</h1>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Hello, HOD. Here is your department snapshot.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-2 rounded-full">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">Status: Operational</span>
                                </div>
                            </div>

                            <DashboardHome stats={stats} recentActivity={[]} alerts={[]} />
                        </div>
                    )}

                    {activeSection === 'academics' && (
                        <AcademicsView
                            activeClasses={activeClasses}
                            deptCourses={deptCourses}
                            deptStudents={deptStudents}
                            onCreateClass={handleCreateClass}
                            onAddSubject={handleAddSubject}
                            onDeleteCourse={onDeleteCourse}
                            faculty={teachingStaff}
                            onUpdateCourse={onUpdateCourse}
                        />
                    )}

                    {activeSection === 'timetable' && (
                        <TimetableView
                            courses={deptCourses}
                            activeClasses={activeClasses}
                            onUpdateCourse={onUpdateCourse}
                        />
                    )}

                    {activeSection === 'faculty' && (
                        <UserDirectory
                            type="Teacher"
                            users={deptFaculty}
                            onCreateUser={onCreateUser}
                            onCreateUsersBatch={onCreateUsersBatch}
                            department={myDept}
                            activeCourses={deptCourses}
                        />
                    )}

                    {activeSection === 'approvals' && (
                        <ApprovalsView
                            pendingUsers={allUsers.filter(u => u.collegeId === college.id && u.department === myDept && !u.isApproved && u.isRegistered && u.tag === 'Teacher')}
                            onApprove={onApproveTeacherRequest}
                            onDecline={onDeclineTeacherRequest}
                        />
                    )}

                    {activeSection === 'students' && (
                        <UserDirectory
                            type="Student"
                            users={deptStudents}
                            onCreateUser={onCreateUser}
                            onCreateUsersBatch={onCreateUsersBatch}
                            department={myDept}
                            activeCourses={deptCourses}
                        />
                    )}

                    {activeSection === 'settings' && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
                            <div className="p-6 bg-card rounded-full shadow-sm border border-border mb-4">
                                <SettingsIcon className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Department Settings</h2>
                            <p className="text-muted-foreground mt-2 max-w-md">
                                Configure department profile, roles, and academic preferences.
                            </p>
                        </div>
                    )}

                    {activeSection === 'notices' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-foreground">Department Notices</h2>
                                <button onClick={() => setIsCreateNoticeModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 shadow-md">
                                    <PlusIcon className="w-4 h-4"/> New Notice
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {notices.filter(n => (!n.collegeId || n.collegeId === college.id) && (!n.targetDepartments || n.targetDepartments.includes(myDept))).map(notice => (
                                    <div key={notice.id} className="bg-card p-5 rounded-xl border border-border shadow-sm relative group">
                                        <button onClick={() => onDeleteNotice(notice.id)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                        <h3 className="font-bold text-lg text-foreground mb-2">{notice.title}</h3>
                                        {notice.mediaUrl && (
                                            <div className="mb-3 rounded-lg overflow-hidden border border-border max-h-48">
                                                <img src={notice.mediaUrl} alt={notice.title} className="w-full object-cover" />
                                            </div>
                                        )}
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{notice.content}</p>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3"/> {new Date(notice.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                                {notices.length === 0 && <p className="text-muted-foreground text-center py-8">No notices found.</p>}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={onCreateNotice} />}

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default HodPage;
