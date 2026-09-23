import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Image as ImageIcon,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  UploadCloud,
  FileText,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  Minimize2,
  Maximize2
} from 'lucide-react';

// 6 Status Timeline Stages
const TIMELINE_STAGES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'Inspection',
  'Maintenance',
  'Resolved'
];

const PROBLEM_OPTIONS = [
  'Pothole',
  'Road Crack',
  'Damaged Road Surface',
  'Water Logging',
  'Drainage Problem',
  'Other'
];

const URGENCY_OPTIONS = [
  { label: 'Normal', color: 'text-blue-700 bg-blue-50 border-blue-200', desc: 'Routine repair required' },
  { label: 'Urgent', color: 'text-amber-700 bg-amber-50 border-amber-200', desc: 'Affecting traffic speed & safety' },
  { label: 'Dangerous', color: 'text-red-700 bg-red-50 border-red-200', desc: 'Severe hazard, accident risk' }
];

// Helper to generate unique Ticket ID: RC-YYYYMMDD-XXXXX
const generateTicketId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `RC-${dateStr}-${randomNum}`;
};

// Monotonic unique ID generator for React keys
let msgCounter = 0;
const createUniqueMessageId = (sender = 'msg') => {
  msgCounter += 1;
  return `${sender}-${Date.now()}-${msgCounter}-${Math.random().toString(36).substring(2, 7)}`;
};

export default function RoadCareChatbot({ inline = false }) {
  const [isOpen, setIsOpen] = useState(inline);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Form Flow State
  const [currentStep, setCurrentStep] = useState('WELCOME'); 
  // 'WELCOME', 'ASK_PROBLEM', 'ASK_LOCATION', 'ASK_DESC', 'ASK_MEDIA', 'ASK_URGENCY', 'ASK_CONTACT', 'CONFIRMATION', 'SUBMITTED', 'TRACK_INPUT', 'TRACK_RESULT'

  const [formData, setFormData] = useState({
    problemType: '',
    location: '',
    gpsLocation: null,
    gpsAddress: '',
    description: '',
    mediaFile: null,
    mediaPreview: null,
    mediaType: null,
    urgency: 'Normal',
    userName: '',
    mobileNumber: ''
  });

  const [lastTicket, setLastTicket] = useState(null);
  const [trackingTicket, setTrackingTicket] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initChat = () => {
    setMessages([
      {
        id: createUniqueMessageId('bot'),
        sender: 'bot',
        text: 'Hi! I’m RoadCare Assistant. I can help you report a road problem or track your complaint.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: ['🚧 Report Road Problem', '🎫 Track My Ticket']
      }
    ]);
    setCurrentStep('WELCOME');
  };

  const addBotMessage = (text, options = {}) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: createUniqueMessageId('bot'),
          sender: 'bot',
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: options.quickActions || null,
          customComponent: options.customComponent || null
        }
      ]);
    }, 600);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createUniqueMessageId('user'),
        sender: 'user',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Handle Quick Actions
  const handleQuickAction = (action) => {
    addUserMessage(action);

    if (action.includes('Report Road Problem') || action.includes('Register Complaint')) {
      setCurrentStep('ASK_PROBLEM');
      addBotMessage('1. What problem did you notice?', {
        quickActions: PROBLEM_OPTIONS
      });
    } else if (action.includes('Track My Ticket') || action.includes('Track Ticket')) {
      setCurrentStep('TRACK_INPUT');
      addBotMessage('Please enter your Ticket ID (e.g., RC-20260919-00421).');
    } else if (PROBLEM_OPTIONS.includes(action)) {
      handleProblemSelect(action);
    } else if (['Normal', 'Urgent', 'Dangerous'].includes(action)) {
      handleUrgencySelect(action);
    } else if (action === '📍 Use My Current Location') {
      handleGetLocation();
    } else if (action === 'Skip Upload') {
      handleSkipUpload();
    } else if (action === 'Submit Complaint') {
      handleSubmitComplaint();
    } else if (action === 'Edit Details') {
      handleEditDetails();
    }
  };

  // 1. Problem Selection
  const handleProblemSelect = (problem) => {
    setFormData((prev) => ({ ...prev, problemType: problem }));
    setCurrentStep('ASK_LOCATION');
    addBotMessage(`Noted: ${problem}.\n\n2. Where is the problem?\nPlease provide Road / Street Name, Area, District, or Landmark. You can also share your GPS coordinates:`, {
      quickActions: ['📍 Use My Current Location']
    });
  };

  // 2. GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      addBotMessage('Geolocation is not supported by your browser. Please type the location manually.');
      return;
    }

    addBotMessage('Detecting your GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const coordsStr = `${lat}, ${lng}`;

        setFormData((prev) => ({
          ...prev,
          gpsLocation: coordsStr,
          location: prev.location || `GPS: ${coordsStr}`
        }));

        addUserMessage(`📍 Shared GPS: ${coordsStr}`);
        setCurrentStep('ASK_DESC');
        addBotMessage(`GPS Location recorded (${coordsStr}).\n\n3. Describe the problem in detail (e.g., approximate size, impact on vehicles):`);
      },
      (err) => {
        addBotMessage('Unable to retrieve GPS location. Please enter the road/street name manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 3. Media Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      mediaFile: file,
      mediaPreview: previewUrl,
      mediaType: isVideo ? 'video' : 'image'
    }));

    addUserMessage(`📎 Uploaded evidence: ${file.name}`);
    setCurrentStep('ASK_URGENCY');
    addBotMessage('Evidence uploaded successfully!\n\n5. How urgent is the problem?', {
      quickActions: ['Normal', 'Urgent', 'Dangerous']
    });
  };

  const handleSkipUpload = () => {
    addUserMessage('Skip Upload');
    setCurrentStep('ASK_URGENCY');
    addBotMessage('Upload skipped.\n\n5. How urgent is the problem?', {
      quickActions: ['Normal', 'Urgent', 'Dangerous']
    });
  };

  // 4. Urgency Select
  const handleUrgencySelect = (urgency) => {
    setFormData((prev) => ({ ...prev, urgency }));
    setCurrentStep('ASK_CONTACT');
    addBotMessage('6. Please provide your contact details.\nEnter your Name and Mobile Number (e.g. John Doe, 9876543210):');
  };

  // 5. Submit Complaint
  const handleSubmitComplaint = () => {
    const ticketId = generateTicketId();
    const priority = formData.urgency === 'Dangerous' ? 'Critical' : (formData.urgency === 'Urgent' ? 'High' : 'Medium');
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const newTicket = {
      ticketId,
      problemType: formData.problemType || 'Pothole',
      location: formData.location || 'Reported Road Corridor',
      description: formData.description,
      urgency: formData.urgency,
      priority,
      status: 'Submitted',
      date: dateStr,
      userName: formData.userName,
      mobileNumber: formData.mobileNumber,
      gpsLocation: formData.gpsLocation,
      mediaPreview: formData.mediaPreview,
      mediaType: formData.mediaType
    };

    // Save to local storage for tracking
    try {
      const existing = JSON.parse(localStorage.getItem('roadcare_tickets') || '[]');
      existing.unshift(newTicket);
      localStorage.setItem('roadcare_tickets', JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    setLastTicket(newTicket);
    setCurrentStep('SUBMITTED');

    addBotMessage('✅ Complaint Registered Successfully', {
      customComponent: renderSuccessCard(newTicket)
    });
  };

  const handleEditDetails = () => {
    addUserMessage('Edit Details');
    setCurrentStep('ASK_PROBLEM');
    addBotMessage('Let’s update your details.\n\n1. What problem did you notice?', {
      quickActions: PROBLEM_OPTIONS
    });
  };

  // Tracking Lookup
  const handleTrackTicket = (inputTicketId) => {
    const searchId = (inputTicketId || '').trim().toUpperCase();
    if (!searchId) {
      addBotMessage('Please enter a valid Ticket ID.');
      return;
    }

    addUserMessage(searchId);

    // Look up in localStorage or fallback mock
    let found = null;
    try {
      const stored = JSON.parse(localStorage.getItem('roadcare_tickets') || '[]');
      found = stored.find((t) => t.ticketId.toUpperCase() === searchId);
    } catch (e) {}

    // Mock demonstration fallback if not found in local storage
    if (!found) {
      if (searchId.startsWith('RC-')) {
        found = {
          ticketId: searchId,
          problemType: 'Pothole',
          location: 'XYZ Road, Main Sector',
          priority: 'High',
          status: 'Under Inspection',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          stageIndex: 3 // Inspection
        };
      }
    }

    if (found) {
      setTrackingTicket(found);
      setCurrentStep('TRACK_RESULT');
      addBotMessage(`Ticket details retrieved for ${found.ticketId}:`, {
        customComponent: renderTrackCard(found)
      });
    } else {
      addBotMessage(`❌ No complaint found with Ticket ID "${searchId}". Please verify the number or register a new complaint.`, {
        quickActions: ['🚧 Report Road Problem', '🎫 Track Another Ticket']
      });
    }
  };

  // Text Input Submit
  const handleTextSubmit = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    addUserMessage(text);

    // Flow Routing based on current step
    switch (currentStep) {
      case 'WELCOME':
        if (text.toUpperCase().startsWith('RC-')) {
          handleTrackTicket(text);
        } else if (text.toLowerCase().includes('track') || text.toLowerCase().includes('status')) {
          setCurrentStep('TRACK_INPUT');
          addBotMessage('Please enter your Ticket ID (e.g. RC-20260919-00421).');
        } else {
          setCurrentStep('ASK_PROBLEM');
          addBotMessage('1. What problem did you notice?', {
            quickActions: PROBLEM_OPTIONS
          });
        }
        break;

      case 'ASK_PROBLEM':
        setFormData((prev) => ({ ...prev, problemType: text }));
        setCurrentStep('ASK_LOCATION');
        addBotMessage(`Noted: ${text}.\n\n2. Where is the problem?\nPlease provide Road / Street Name, Area, District, or Landmark:`, {
          quickActions: ['📍 Use My Current Location']
        });
        break;

      case 'ASK_LOCATION':
        setFormData((prev) => ({ ...prev, location: text }));
        setCurrentStep('ASK_DESC');
        addBotMessage('3. Describe the problem in detail (e.g., approximate size, vehicle damage risk):');
        break;

      case 'ASK_DESC':
        setFormData((prev) => ({ ...prev, description: text }));
        setCurrentStep('ASK_MEDIA');
        addBotMessage('4. Upload evidence.\nPlease upload a photo or video of the road problem, or type "skip":', {
          quickActions: ['Skip Upload']
        });
        break;

      case 'ASK_MEDIA':
        if (text.toLowerCase().includes('skip')) {
          handleSkipUpload();
        } else {
          addBotMessage('Please use the upload button (📎) below to select a photo or video, or click "Skip Upload".', {
            quickActions: ['Skip Upload']
          });
        }
        break;

      case 'ASK_URGENCY':
        const matched = URGENCY_OPTIONS.find((u) => u.label.toLowerCase() === text.toLowerCase());
        const urgencyVal = matched ? matched.label : 'Normal';
        setFormData((prev) => ({ ...prev, urgency: urgencyVal }));
        setCurrentStep('ASK_CONTACT');
        addBotMessage('6. Please provide your contact details.\nEnter your Name and Mobile Number (e.g. John Doe, 9876543210):');
        break;

      case 'ASK_CONTACT':
        // Parse name and phone
        const phoneMatch = text.match(/\d{7,12}/);
        const nameVal = text.replace(/\d{7,12}/, '').replace(/,/g, '').trim() || 'Citizen';
        const phoneVal = phoneMatch ? phoneMatch[0] : 'Not Provided';

        const updatedData = {
          ...formData,
          userName: nameVal,
          mobileNumber: phoneVal
        };
        setFormData(updatedData);
        setCurrentStep('CONFIRMATION');

        addBotMessage('Please review your Complaint Summary before submitting:', {
          customComponent: renderSummaryCard(updatedData)
        });
        break;

      case 'TRACK_INPUT':
        handleTrackTicket(text);
        break;

      case 'TRACK_RESULT':
      case 'SUBMITTED':
        if (text.toUpperCase().startsWith('RC-')) {
          handleTrackTicket(text);
        } else {
          initChat();
        }
        break;

      default:
        addBotMessage('I am here to assist you with road complaints and ticket tracking. Would you like to report a problem or track a ticket?', {
          quickActions: ['🚧 Report Road Problem', '🎫 Track My Ticket']
        });
    }
  };

  // Render Complaint Summary Card
  const renderSummaryCard = (data) => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-3 mt-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-sky-600" />
            Complaint Summary
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            data.urgency === 'Dangerous'
              ? 'bg-red-50 text-red-700 border-red-200'
              : data.urgency === 'Urgent'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {data.urgency}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Problem Type</span>
            <span className="font-semibold text-slate-800">{data.problemType || 'Pothole'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Location</span>
            <span className="font-semibold text-slate-800 truncate block">{data.location || 'XYZ Road'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">GPS Status</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-600" />
              {data.gpsLocation ? 'Available' : 'Not Shared'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Evidence</span>
            <span className="font-semibold text-slate-800">
              {data.mediaFile ? `1 ${data.mediaType === 'video' ? 'Video' : 'Image'}` : 'None'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Description</span>
          <p className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded border border-slate-100 italic">
            "{data.description || 'Road surface disruption affecting traffic.'}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Citizen Name</span>
            <span className="font-medium text-slate-700">{data.userName || 'Citizen'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Mobile</span>
            <span className="font-medium text-slate-700">{data.mobileNumber || 'Not Provided'}</span>
          </div>
        </div>

        {/* Media Preview if attached */}
        {data.mediaPreview && (
          <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
            {data.mediaType === 'video' ? (
              <video src={data.mediaPreview} className="w-full h-28 object-cover" controls />
            ) : (
              <img src={data.mediaPreview} alt="Evidence" className="w-full h-28 object-cover" />
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleSubmitComplaint}
            className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Submit Complaint
          </button>
          <button
            onClick={handleEditDetails}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition-colors"
          >
            Edit Details
          </button>
        </div>
      </div>
    );
  };

  // Render Submission Success Card
  const renderSuccessCard = (ticket) => {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm text-xs space-y-3 mt-1 text-slate-800">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Complaint Registered Successfully</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Ticket ID</span>
            <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {ticket.ticketId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Problem Type</span>
              <span className="font-semibold text-slate-800">{ticket.problemType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Priority</span>
              <span className="font-bold text-red-600">{ticket.priority}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Location</span>
              <span className="font-semibold text-slate-800 truncate block">{ticket.location}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Status</span>
              <span className="font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">
                {ticket.status}
              </span>
            </div>
          </div>

          <div className="pt-1 text-[10px] text-slate-400">
            Registered on: <span className="text-slate-600 font-medium">{ticket.date}</span>
          </div>
        </div>

        <button
          onClick={() => handleTrackTicket(ticket.ticketId)}
          className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          🎫 Track This Ticket
        </button>
      </div>
    );
  };

  // Render Track Ticket Card with 6-stage Visual Status Timeline
  const renderTrackCard = (ticket) => {
    const currentStatus = ticket.status || 'Submitted';
    const stageIdx = ticket.stageIndex !== undefined
      ? ticket.stageIndex
      : TIMELINE_STAGES.findIndex((s) => s.toLowerCase() === currentStatus.toLowerCase()) >= 0
      ? TIMELINE_STAGES.findIndex((s) => s.toLowerCase() === currentStatus.toLowerCase())
      : 3; // Default to Inspection for demo

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-3 mt-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Ticket Telemetry</span>
            <span className="font-mono font-bold text-sky-700 text-xs">{ticket.ticketId}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {ticket.status || 'Under Inspection'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Problem</span>
            <span className="font-semibold text-slate-800">{ticket.problemType || 'Pothole'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Priority</span>
            <span className="font-bold text-red-600">{ticket.priority || 'High'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] text-slate-400 block uppercase">Location</span>
            <span className="font-semibold text-slate-800 truncate block">{ticket.location || 'XYZ Road'}</span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">Status Timeline</span>
          <div className="relative flex items-center justify-between">
            {/* Progress line */}
            <div className="absolute top-2.5 left-2 right-2 h-0.5 bg-slate-200 -z-0">
              <div
                className="h-full bg-sky-600 transition-all duration-500"
                style={{ width: `${(stageIdx / (TIMELINE_STAGES.length - 1)) * 100}%` }}
              />
            </div>

            {TIMELINE_STAGES.map((stage, idx) => {
              const isPast = idx < stageIdx;
              const isCurrent = idx === stageIdx;
              return (
                <div key={stage} className="flex flex-col items-center z-10">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      isPast
                        ? 'bg-sky-600 text-white'
                        : isCurrent
                        ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[8px] mt-1 text-center font-medium leading-tight max-w-[45px] ${
                      isCurrent ? 'text-sky-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100">
          <span>Last Updated: {ticket.date || 'Today'}</span>
          <button
            onClick={() => handleQuickAction('🚧 Report Road Problem')}
            className="text-sky-600 hover:text-sky-700 font-bold"
          >
            + Report Another
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!inline && !isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 group focus:outline-none focus:ring-4 focus:ring-sky-300"
          aria-label="Open RoadCare Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-sky-700 animate-pulse" />
          </div>
          <span className="font-bold text-xs tracking-wide">🤖 RoadCare Assistant</span>
        </button>
      )}

      {/* Chat Window Modal / Card */}
      {isOpen && (
        <div
          className={
            inline
              ? 'w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[600px]'
              : `fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col transition-all duration-300 ${
                  isMinimized ? 'h-14' : 'h-[620px] max-h-[85vh]'
                }`
          }
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-sm select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-600/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs tracking-wide text-white">RoadCare Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Citizen Road Support & Tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={initChat}
                title="Restart Chat"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {!inline && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand' : 'Minimize'}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
              )}
              {!inline && (
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Body / Chat Messages (Hidden if minimized) */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[88%]">
                      {msg.sender === 'bot' && (
                        <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] flex-shrink-0 mb-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-2xl shadow-sm whitespace-pre-line leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-sky-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                        }`}
                      >
                        {msg.text}

                        {/* Embedded Custom Card if available */}
                        {msg.customComponent}
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] flex-shrink-0 mb-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-400 mt-0.5 px-8">
                      {msg.time}
                    </span>

                    {/* Quick Action Chips */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pl-7 max-w-full">
                        {msg.quickActions.map((action, actionIdx) => (
                          <button
                            key={`${msg.id}-action-${actionIdx}-${action}`}
                            onClick={() => handleQuickAction(action)}
                            className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 hover:border-sky-300 rounded-full font-semibold text-[11px] shadow-sm transition-all transform hover:scale-[1.02] active:scale-95"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5 pl-1">
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Upload Preview Chip if file selected */}
              {formData.mediaPreview && currentStep === 'ASK_MEDIA' && (
                <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {formData.mediaFile?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setFormData((prev) => ({ ...prev, mediaFile: null, mediaPreview: null }))}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 bg-white border-t border-slate-200">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*"
                  className="hidden"
                />

                <form onSubmit={handleTextSubmit} className="flex items-center gap-1.5">
                  {/* Media Upload Trigger Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Photo or Video Evidence"
                    className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors border border-slate-200"
                  >
                    <UploadCloud className="w-4 h-4" />
                  </button>

                  {/* GPS Button */}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    title="Share Current GPS Location"
                    className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors border border-slate-200"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message or Ticket ID..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Action Navigation Bar */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                  <button
                    onClick={() => handleQuickAction('🚧 Report Road Problem')}
                    className="hover:text-sky-600 font-semibold"
                  >
                    + Report Problem
                  </button>
                  <button
                    onClick={() => handleQuickAction('🎫 Track My Ticket')}
                    className="hover:text-sky-600 font-semibold"
                  >
                    🔍 Track Ticket
                  </button>
                  <span>RoadCare AI</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
