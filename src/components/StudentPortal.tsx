import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause,
  Check, 
  BookOpen, 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  Upload, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  Bookmark, 
  FileText,
  Volume2,
  Maximize2,
  Calendar,
  AlertCircle,
  Trophy,
  Activity,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { SYLLABUS_MODULES, INITIAL_QUESTIONS } from '../data';
import { Module, Question, ProjectSubmission } from '../types';

interface StudentPortalProps {
  onNavigate: (screen: 'landing') => void;
  selectedModule: Module | null;
}

export default function StudentPortal({ onNavigate, selectedModule }: StudentPortalProps) {
  // Portal state
  const [modules, setModules] = useState<Module[]>(SYLLABUS_MODULES);
  const [activeModule, setActiveModule] = useState<Module>(selectedModule || SYLLABUS_MODULES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [videoProgress, setVideoProgress] = useState(35); // mock initial video timeline state

  // Community questions forum
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [newQuestionText, setNewQuestionText] = useState('');
  
  // Student Notes
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [isSavedNotes, setIsSavedNotes] = useState(false);

  // Project submissions
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [critiqueResponse, setCritiqueResponse] = useState<string | null>(null);

  // Load and save local state
  useEffect(() => {
    // Load module completion progress from localStorage
    const savedCompletions = localStorage.getItem('edu_completions');
    if (savedCompletions) {
      const completionIds = JSON.parse(savedCompletions) as string[];
      setModules(prev => prev.map(m => ({ ...m, isCompleted: completionIds.includes(m.id) })));
    }

    // Load active notes for this module
    const savedNotes = localStorage.getItem(`edu_notes_${activeModule.id}`);
    if (savedNotes) {
      setStudentNotes(savedNotes);
    } else {
      setStudentNotes('');
    }

    // Load custom student submissions
    const savedSubmissions = localStorage.getItem('edu_submissions');
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions));
    }
  }, [activeModule]);

  // Handle module checkbox toggle
  const handleToggleComplete = (id: string) => {
    const updatedModules = modules.map(m => {
      if (m.id === id) {
        return { ...m, isCompleted: !m.isCompleted };
      }
      return m;
    });
    setModules(updatedModules);

    // Save to localStorage
    const completedIds = updatedModules.filter(m => m.isCompleted).map(m => m.id);
    localStorage.setItem('edu_completions', JSON.stringify(completedIds));
  };

  // Save Notes
  const handleSaveNotes = () => {
    localStorage.setItem(`edu_notes_${activeModule.id}`, studentNotes);
    setIsSavedNotes(true);
    setTimeout(() => setIsSavedNotes(false), 2000);
  };

  // Post Question
  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQ: Question = {
      id: 'q-' + Date.now(),
      user: 'Elena K. (You)',
      text: newQuestionText.trim(),
      timestamp: 'Just now',
      votes: 1
    };

    setQuestions([newQ, ...questions]);
    setNewQuestionText('');
  };

  // Upvote Question
  const handleUpvoteQuestion = (id: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, votes: q.votes + 1 };
      }
      return q;
    }));
  };

  // Project submission Drag and Drop handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      triggerSimulatedUpload(e.dataTransfer.files[0].name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerSimulatedUpload(e.target.files[0].name);
    }
  };

  // Simulate an upload and generate high-end architectural feedback
  const triggerSimulatedUpload = (fileName: string) => {
    if (!projectTitle.trim()) {
      alert("Please specify a project title first before uploading.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(10);
    setCritiqueResponse(null);

    // Increment progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            finalizeSubmission(fileName);
          }, 500);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const finalizeSubmission = (fileName: string) => {
    setIsUploading(false);
    setUploadProgress(0);

    // Generate smart mock feedback tailored to the selected module
    let generatedCritique = "";
    if (activeModule.id === 'm1') {
      generatedCritique = `Excellent resolution of structural order, Elena. Your proportional grid division demonstrates a mature understanding of Le Corbusier's Domino principles. However, the corner joints feel slightly heavy; I would suggest introducing a 15mm negative recess between the concrete pillar and the partition wall to let the structure breathe. This will emphasize the grid's tectonic lightness.`;
    } else if (activeModule.id === 'm2') {
      generatedCritique = `This parametric model is highly dynamic! The louvier attractor points respond elegantly to the sunlight vector simulation. To push this further, analyze the environmental stress values at midday. You might want to remap your attractor function to standard parabolic curves, which will reduce material fabrication costs while maintaining organic daylight modulation.`;
    } else {
      generatedCritique = `Impressive joinery diagram. The steel-to-timber anchor details are articulated with clear constructive poetry. Ensure that the CNC timber notches account for 2% atmospheric swelling in humid coastal environments. Consider reducing the bolts' diameter to 12mm to keep the visual profile razor-sharp. Keep up this high standard!`;
    }

    const newSubmission: ProjectSubmission = {
      id: 'sub-' + Date.now(),
      title: projectTitle,
      description: projectDesc || `Syllabus exercise draft submission: ${fileName}`,
      status: 'reviewed',
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      feedback: generatedCritique
    };

    const updatedSubmissions = [newSubmission, ...submissions];
    setSubmissions(updatedSubmissions);
    localStorage.setItem('edu_submissions', JSON.stringify(updatedSubmissions));
    setCritiqueResponse(generatedCritique);
    setProjectTitle('');
    setProjectDesc('');
  };

  // Stats calculation
  const completedCount = modules.filter(m => m.isCompleted).length;
  const progressPercent = Math.round((completedCount / modules.length) * 100);

  return (
    <div className="bg-[#fcf8f8] min-h-screen text-[#1c1b1c] font-sans pb-16 pt-20">
      
      {/* Top Portal Header */}
      <nav className="bg-white border-b border-stone-200/80 fixed top-0 w-full z-40 h-16">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('landing')}
              className="text-stone-400 hover:text-stone-900 transition-colors p-1"
              title="Leave student hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-stone-200" />
            <div className="font-serif text-lg font-semibold tracking-tight text-stone-900">
              EduPortal Student Hub
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 bg-stone-50 border border-stone-100 px-4 py-1.5 rounded-full text-xs font-semibold text-stone-600">
              <Activity className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Status: Active Practitioner</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <button 
              onClick={() => onNavigate('landing')}
              className="text-xs font-bold text-stone-400 hover:text-red-600 transition-colors uppercase tracking-wider"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace layout */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (xl:col-span-3): Modules Syllabus Directory */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Progress Card */}
          <div className="bg-white rounded-[20px] p-5 border border-stone-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400">Cohort Progress</h3>
              <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full">
                {completedCount}/{modules.length} Done
              </span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-stone-950 h-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              Toggle lesson checkboxes below to update progress. Finish all 4 modules to earn the cohort certificate.
            </p>
          </div>

          {/* Module List Directory */}
          <div className="bg-white rounded-[20px] border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50/50">
              <h3 className="font-serif text-base font-semibold text-stone-900">Syllabus Directory</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {modules.map((mod) => (
                <div 
                  key={mod.id}
                  className={`p-4 transition-colors flex items-start gap-3 relative ${
                    activeModule.id === mod.id ? 'bg-stone-50' : 'hover:bg-stone-50/30'
                  }`}
                >
                  {/* Left Active border pill */}
                  {activeModule.id === mod.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-950" />
                  )}

                  {/* Completion Checkbox */}
                  <div className="pt-0.5">
                    <input 
                      type="checkbox" 
                      checked={mod.isCompleted}
                      onChange={() => handleToggleComplete(mod.id)}
                      className="rounded text-stone-900 focus:ring-stone-900 h-4 w-4 cursor-pointer"
                      title="Mark module complete"
                    />
                  </div>

                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => setActiveModule(mod)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        {mod.duration}
                      </span>
                      {mod.isCompleted && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3 stroke-[3]" /> Completed
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-sm font-medium text-stone-900 mt-0.5 leading-snug">
                      {mod.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Masterclass Cohort Specs Card */}
          <div className="bg-stone-900 text-stone-100 rounded-[20px] p-5 border border-stone-800">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h4 className="font-serif text-sm font-medium">Cohort Certifications</h4>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Upon finishing the grid and tectonic exercises, present your draft to the panel during the live fortnightly Guest Critique to receive your stamped Diploma.
            </p>
            <div className="text-[10px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1">
              <span>View Requirements</span>
              <span>→</span>
            </div>
          </div>

        </div>

        {/* Center Column (xl:col-span-6): Active Lecture Player & Notes */}
        <div className="xl:col-span-6 flex flex-col gap-6">
          
          {/* Active Lesson Video Player Card */}
          <div className="bg-white rounded-[24px] border border-stone-200/80 shadow-sm overflow-hidden">
            
            {/* Visual Screen Player */}
            <div className="aspect-video bg-black relative w-full group">
              <img 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80" 
                alt="Active masterclass lesson screenshot"
                src={activeModule.videoUrl}
              />
              <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/35 transition-colors" />

              {/* Central play trigger */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-white/95 text-stone-950 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg scale-100 hover:scale-105 active:scale-95 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-stone-950 ml-0" />
                  ) : (
                    <Play className="w-7 h-7 fill-stone-950 ml-1.5" />
                  )}
                </button>
              </div>

              {/* Player UI Toolbar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950/90 to-transparent p-4 flex flex-col gap-3">
                
                {/* Progress bar timeline */}
                <div 
                  className="w-full bg-stone-700 h-1 rounded-full overflow-hidden cursor-pointer relative hover:h-1.5 transition-all"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    setVideoProgress(percent);
                  }}
                >
                  <div className="bg-white h-full" style={{ width: `${videoProgress}%` }} />
                </div>

                <div className="flex justify-between items-center text-white text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {isPlaying ? 'Streaming Lesson Live' : 'Streaming Paused'}
                    </span>
                    <span className="text-stone-400">
                      {Math.floor((activeModule.duration.includes('h') ? 45 : 15) * (videoProgress/100))}:20 / {activeModule.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Speed controllers */}
                    <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                      <button 
                        onClick={() => setPlaybackSpeed(1.0)} 
                        className={`hover:text-white px-1 ${playbackSpeed === 1.0 ? 'text-white font-bold' : 'text-stone-400'}`}
                      >
                        1.0x
                      </button>
                      <button 
                        onClick={() => setPlaybackSpeed(1.5)} 
                        className={`hover:text-white px-1 ${playbackSpeed === 1.5 ? 'text-white font-bold' : 'text-stone-400'}`}
                      >
                        1.5x
                      </button>
                      <button 
                        onClick={() => setPlaybackSpeed(2.0)} 
                        className={`hover:text-white px-1 ${playbackSpeed === 2.0 ? 'text-white font-bold' : 'text-stone-400'}`}
                      >
                        2.0x
                      </button>
                    </div>

                    <Volume2 className="w-4 h-4 text-stone-300 hover:text-white cursor-pointer" />
                    <Maximize2 className="w-4 h-4 text-stone-300 hover:text-white cursor-pointer" />
                  </div>
                </div>

              </div>
            </div>

            {/* Active module information */}
            <div className="p-6">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
                Currently Playing Lecture
              </span>
              <h2 className="font-serif text-2xl font-medium text-stone-950 mb-3">
                {activeModule.title}
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                {activeModule.description}
              </p>

              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                Syllabus Chapter Milestones:
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {activeModule.notes.map((note, index) => (
                  <li key={index} className="text-xs text-stone-500 flex items-start gap-2">
                    <span className="text-stone-900 font-bold mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Student Lecture Notebook tab area */}
          <div className="bg-white rounded-[24px] p-6 border border-stone-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-stone-900" />
                <h3 className="font-serif text-lg font-medium text-stone-950">Active Lecture Notebook</h3>
              </div>
              {isSavedNotes && (
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Saved locally
                </span>
              )}
            </div>

            <p className="text-xs text-stone-400 leading-normal">
              Jot down thoughts, time stamps, and structural questions below. Notes are stored automatically on this browser.
            </p>

            <textarea 
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="e.g., Grid divisions can provide asymmetrical balances. Mies columns are recessed inside. Remember to cross-reference Module 03 on Joint assemblages..."
              className="w-full min-h-[140px] rounded-xl border border-stone-200 p-4 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 leading-relaxed bg-stone-50/50"
            />

            <div className="flex justify-end">
              <button 
                onClick={handleSaveNotes}
                className="bg-stone-900 text-white rounded-full px-5 py-2.5 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Save Notebook Notes
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (xl:col-span-3): Live Q&A and Smart Critique Submission */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Guest Critique Live Events Schedule */}
          <div className="bg-white rounded-[20px] p-5 border border-stone-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-stone-100">
              <Calendar className="w-4 h-4 text-stone-900" />
              <h3 className="font-serif text-sm font-medium text-stone-900">Critique Schedule</h3>
            </div>
            
            <div className="flex gap-3 items-start text-xs mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-[#f7dece] text-[#5d2a1a] flex flex-col items-center justify-center font-bold shrink-0">
                <span className="text-[10px] uppercase leading-none">Sep</span>
                <span className="text-sm leading-none mt-0.5">04</span>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 leading-tight">Live Joint Tectonic Review</h4>
                <p className="text-stone-400 text-[11px] mt-0.5">with Prof. Kengo Kuma</p>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block font-semibold">
                  14:00 GMT+1
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Project Submission with simulated smart CAD critique */}
          <div className="bg-white rounded-[20px] p-5 border border-stone-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
              <Upload className="w-4 h-4 text-stone-900" />
              <h3 className="font-serif text-sm font-medium text-stone-900">Submit Project Draft</h3>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal">
              Specify a title, drop your CAD/PDF blueprint, and get instant review feedback from the automated AI mentor.
            </p>

            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Project Title (e.g., 9-Square Grid study)"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
              />
              <textarea 
                placeholder="Brief description (optional)..."
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full h-14 rounded-xl border border-stone-200 p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 resize-none"
              />
            </div>

            {/* Drag & Drop Canvas */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:bg-stone-50/50'
              }`}
            >
              <input 
                type="file" 
                id="portal-file-upload" 
                multiple={false}
                onChange={handleFileInput}
                className="hidden" 
              />
              <label htmlFor="portal-file-upload" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-6 h-6 text-stone-400 mb-2" />
                <span className="text-xs text-stone-800 font-semibold block">
                  Drag & Drop or Browse
                </span>
                <span className="text-[10px] text-stone-400 block mt-1">
                  Supports CAD, PDF, JPG, Rhino (max 10MB)
                </span>
              </label>
            </div>

            {/* Upload progress indicator */}
            {isUploading && (
              <div className="bg-stone-50 border border-stone-100 p-3 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-stone-700 mb-1.5 leading-none">
                  <span>Uploading blueprint...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-stone-900 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Visual confirmation feedback box */}
            {critiqueResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl text-xs"
              >
                <div className="flex items-center gap-1 text-amber-900 font-bold mb-2 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" /> Critique Panel Feedback
                </div>
                <p className="text-stone-700 leading-relaxed font-serif italic">
                  {critiqueResponse}
                </p>
              </motion.div>
            )}

            {/* History of submissions */}
            {submissions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2.5">
                  Submission History ({submissions.length})
                </h4>
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="bg-stone-50 border border-stone-100 p-2.5 rounded-xl text-[11px]">
                      <div className="flex justify-between items-start font-semibold text-stone-900">
                        <span className="truncate max-w-[130px]">{sub.title}</span>
                        <span className="text-[9px] text-stone-400 font-medium shrink-0">{sub.submittedAt}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate mt-0.5">{sub.description}</p>
                      
                      <button 
                        onClick={() => setCritiqueResponse(sub.feedback || null)}
                        className="text-[10px] text-[#5d2a1a] font-bold mt-1.5 flex items-center gap-0.5 hover:underline"
                      >
                        <FileCheck className="w-3 h-3 shrink-0" /> Read Panel Critique
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Interactive Community Q&A Forum */}
          <div className="bg-white rounded-[20px] p-5 border border-stone-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
              <MessageSquare className="w-4 h-4 text-stone-900" />
              <h3 className="font-serif text-sm font-medium text-stone-900">Syllabus Q&A Forum</h3>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal">
              Ask structural, parametric, or tectonic questions. Upvote cohort issues to draw guides' attention.
            </p>

            {/* Ask Question Form */}
            <form onSubmit={handlePostQuestion} className="flex gap-1.5">
              <input 
                type="text"
                placeholder="Ask your cohort..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="flex-grow rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
              />
              <button 
                type="submit"
                className="bg-stone-950 text-white rounded-xl px-3 hover:bg-stone-800 transition-colors"
                title="Post question"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Q&A List */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {questions.map((q) => (
                <div key={q.id} className="pb-3 border-b border-stone-100 last:border-b-0">
                  <div className="flex justify-between items-start gap-1 text-[11px]">
                    <span className="font-bold text-stone-800">{q.user}</span>
                    <span className="text-[10px] text-stone-400 shrink-0">{q.timestamp}</span>
                  </div>
                  <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                    {q.text}
                  </p>
                  
                  <div className="flex items-center gap-1.5 mt-2">
                    <button 
                      onClick={() => handleUpvoteQuestion(q.id)}
                      className="text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-0.5 text-[10px] bg-stone-50 hover:bg-stone-100/80 px-2 py-0.5 rounded-full border border-stone-100"
                    >
                      <ThumbsUp className="w-2.5 h-2.5" /> Upvote
                    </button>
                    <span className="text-[10px] text-stone-400 font-semibold">{q.votes} upvotes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
