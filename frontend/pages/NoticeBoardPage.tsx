import React, { useState, useMemo, useRef } from 'react';
import type { User, Notice } from '../types';
import Header from '../components/Header';
import { logout } from '../utils/authUtils';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { MegaphoneIcon, PlusIcon, CloseIcon, ChevronDownIcon, TrashIcon, CheckSquareIcon, ClockIcon } from '../components/Icons';
// FIX: Centralize constants by importing from constants.ts to remove local definitions.
// FIX: `departmentOptions` is not in constants.ts; it is college-specific. Importing `yearOptions` only and defining a placeholder for departments.
import { yearOptions } from '../constants';

const departmentOptions = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration'];

// --- PROPS ---
interface NoticeBoardPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  notices: Notice[];
  users: { [key: string]: User };
  onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
  onDeleteNotice: (noticeId: string) => void;
}

// --- MODAL & SUB-COMPONENTS ---
const CreateNoticeModal: React.FC<{
    onClose: () => void;
    onCreateNotice: (noticeData: any) => void;
}> = ({ onClose, onCreateNotice }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaDataUrl, setMediaDataUrl] = useState<string | undefined>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
    const [targetYears, setTargetYears] = useState<number[]>([]);
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = () => setContent(editorRef.current?.innerHTML || '');
    const applyStyle = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
    };

    const handleDeptToggle = (dept: string) => {
        setTargetDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
    };
    const handleYearToggle = (year: number) => {
        setTargetYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
    };

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

    const handleSubmit = () => {
        if (!title.trim() || !editorRef.current?.innerText.trim()) {
            alert("Title and content cannot be empty.");
            return;
        }
        onCreateNotice({ title, content, targetDepartments, targetYears, mediaDataUrl, mediaType: mediaDataUrl ? 'image' : undefined });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">Post a New Notice</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notice Title" className="w-full text-xl font-bold bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"/>
                    <div className="border border-border rounded-lg">
                        <div className="p-2 border-b border-border flex items-center gap-2">
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('bold'); }} className="font-bold w-8 h-8 rounded hover:bg-muted">B</button>
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('italic'); }} className="italic w-8 h-8 rounded hover:bg-muted">I</button>
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('insertUnorderedList'); }} className="w-8 h-8 rounded hover:bg-muted">UL</button>
                             <button onClick={() => fileInputRef.current?.click()} className="ml-auto text-muted-foreground hover:text-primary transition-colors">🖼️</button>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                        <div ref={editorRef} contentEditable onInput={handleInput} data-placeholder="Write your notice here..." className="w-full min-h-[150px] p-3 text-foreground bg-input focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-text-muted"/>
                    </div>
                    {mediaDataUrl && (
                        <div className="relative inline-block mt-2">
                            <img src={mediaDataUrl} alt="Notice Preview" className="max-h-40 rounded-lg border border-border" />
                            <button onClick={() => setMediaDataUrl(undefined)} className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow-sm"><CloseIcon className="w-3 h-3"/></button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-text-muted mb-2">Target Departments (optional)</h4>
                            <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto">
                                {departmentOptions.map(dept => (
                                    <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={targetDepartments.includes(dept)} onChange={() => handleDeptToggle(dept)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                                        <span>{dept}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-muted mb-2">Target Years (optional)</h4>
                             <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto no-scrollbar">
                                {yearOptions.map(year => (
                                    <label key={year.val} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={targetYears.includes(year.val)} onChange={() => handleYearToggle(year.val)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                                        <span>{year.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-text-muted">If no departments or years are selected, the notice will be visible to all students.</p>
                </div>
                 <div className="p-4 bg-muted/50 border-t border-border flex justify-end">
                    <button onClick={handleSubmit} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105">Post Notice</button>
                </div>
            </div>
        </div>
    );
};

const NoticeBoardPage: React.FC<NoticeBoardPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, notices, users, onCreateNotice, onDeleteNotice } = props;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleLogout = () => { logout(onNavigate); };

    return (
        <div className="bg-muted/50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Notice Board</h1>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        New Notice
                    </button>
                </div>
                <div className="grid gap-6">
                    {notices.map(notice => (
                        <div key={notice.id} className="bg-card p-6 rounded-2xl shadow-sm border border-border relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-xl text-foreground mb-1">{notice.title}</h3>
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3"/> {new Date(notice.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                <button onClick={() => onDeleteNotice(notice.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                            {notice.mediaUrl && (
                                <div className="mb-4 rounded-xl overflow-hidden border border-border bg-muted/30 max-h-[400px] flex justify-center">
                                    <img src={notice.mediaUrl} alt={notice.title} className="max-w-full object-contain" />
                                </div>
                            )}
                            <div className="text-foreground leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: notice.content }} />
                        </div>
                    ))}
                    {notices.length === 0 && (
                        <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                            <MegaphoneIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20"/>
                            <p className="text-lg font-medium text-muted-foreground">No notices posted yet.</p>
                        </div>
                    )}
                </div>
            </main>
            {isCreateModalOpen && <CreateNoticeModal onClose={() => setIsCreateModalOpen(false)} onCreateNotice={onCreateNotice} />}
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default NoticeBoardPage;
