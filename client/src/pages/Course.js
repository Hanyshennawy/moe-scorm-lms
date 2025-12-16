import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Course = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [scormData, setScormData] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    initializeCourse();
    return () => {
      // Cleanup on unmount
      if (sessionId) {
        commitData();
      }
    };
  }, [courseId]);

  const initializeCourse = async () => {
    try {
      // Initialize SCORM session - send courseId in body
      const response = await api.post('/scorm/initialize', { courseId });
      setSessionId(response.data.sessionId);
      setScormData(response.data.scormData || {});
      
      // Get course info
      const courseRes = await api.get('/scorm/course');
      setCourse(courseRes.data.course);
      
      // Set up SCORM API
      setupScormApi(response.data.scormData);
      
      setLoading(false);
    } catch (err) {
      console.error('Course init error:', err);
      toast.error('Failed to load course');
      navigate('/profile');
    }
  };

  const setupScormApi = useCallback((initialData) => {
    // Create SCORM 1.2 API object
    const API = {
      _data: { ...initialData },
      _initialized: false,
      _finished: false,

      LMSInitialize: function(param) {
        console.log('LMSInitialize called');
        this._initialized = true;
        return 'true';
      },

      LMSFinish: function(param) {
        console.log('LMSFinish called');
        this._finished = true;
        commitData();
        return 'true';
      },

      LMSGetValue: function(element) {
        console.log('LMSGetValue:', element);
        const value = this._data[element] || '';
        return value;
      },

      LMSSetValue: function(element, value) {
        console.log('LMSSetValue:', element, value);
        this._data[element] = value;
        
        // Update local state
        setScormData(prev => ({ ...prev, [element]: value }));
        
        // Auto-commit certain elements
        if (['cmi.core.lesson_status', 'cmi.core.score.raw', 'cmi.core.exit'].includes(element)) {
          commitElement(element, value);
        }
        
        return 'true';
      },

      LMSCommit: function(param) {
        console.log('LMSCommit called');
        commitData();
        return 'true';
      },

      LMSGetLastError: function() {
        return '0';
      },

      LMSGetErrorString: function(errorCode) {
        const errors = {
          '0': 'No error',
          '101': 'General exception',
          '201': 'Invalid argument error',
          '202': 'Element cannot have children',
          '203': 'Element not an array',
          '301': 'Not initialized',
          '401': 'Not implemented error',
          '402': 'Invalid set value',
          '403': 'Element is read only',
          '404': 'Element is write only',
          '405': 'Incorrect data type'
        };
        return errors[errorCode] || 'Unknown error';
      },

      LMSGetDiagnostic: function(errorCode) {
        return this.LMSGetErrorString(errorCode);
      }
    };

    // Expose API globally for SCORM content
    window.API = API;
  }, []);

  const commitElement = async (element, value) => {
    try {
      await api.post('/scorm/setValue', {
        courseId,
        element,
        value,
        sessionId
      });
    } catch (err) {
      console.error('Failed to commit element:', err);
    }
  };

  const commitData = async () => {
    try {
      await api.post('/scorm/commit', {
        courseId,
        data: window.API?._data || scormData,
        sessionId
      });
    } catch (err) {
      console.error('Failed to commit data:', err);
    }
  };

  const handleFinish = async () => {
    try {
      await api.post('/scorm/finish', {
        courseId,
        data: window.API?._data || scormData,
        sessionId
      });
      toast.success('Progress saved!');
      navigate('/profile');
    } catch (err) {
      toast.error('Failed to save progress');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.API?._initialized && !window.API?._finished) {
        commitData();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e293b' }}>
        <div className="text-center">
          <div className="animate-spin" style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #334155',
            borderTopColor: '#1a5276',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#94a3b8' }}>Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1e293b' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#0f172a', 
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #334155'
      }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleFinish}
            className="flex items-center gap-2"
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
            <span>Exit Course</span>
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>
          <h1 style={{ color: 'white', fontSize: '1rem', fontWeight: 500 }}>
            {course?.title || 'Course'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2"
            style={{ 
              color: '#94a3b8', 
              background: '#1e293b', 
              border: '1px solid #334155', 
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span className="text-sm">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
          <button 
            onClick={handleFinish}
            style={{ 
              color: 'white', 
              background: '#dc2626', 
              border: 'none', 
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <X size={16} />
            <span className="text-sm">Save & Exit</span>
          </button>
        </div>
      </header>

      {/* SCORM Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          ref={iframeRef}
          src="/scorm/scormdriver/indexAPI.html"
          title="SCORM Content"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Course;
