import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Users, Award, CheckCircle, 
  ArrowRight, Shield, Clock, Zap 
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient" style={{ color: 'white' }}>
        <div className="container py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={32} />
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>MOE Learning Platform</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn" style={{ backgroundColor: 'white', color: '#1a5276' }}>
                Get Started
              </Link>
            </div>
          </nav>
        </div>

        <div className="container py-16" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Professional Development<br />for Educators
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem' }}>
            Empower your teaching with cutting-edge training courses. 
            Learn at your own pace and earn recognized certificates.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn btn-lg" style={{ backgroundColor: 'white', color: '#1a5276' }}>
              Start Learning <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
            </Link>
            <Link to="/login" className="btn btn-lg btn-outline" style={{ borderColor: 'white', color: 'white' }}>
              Sign In
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-8" style={{ opacity: 0.9 }}>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Free for MOE Staff</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Certified Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Self-Paced Learning</span>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16" style={{ backgroundColor: 'white' }}>
        <div className="container">
          <h2 className="text-center text-2xl font-bold mb-2">Why Choose Our Platform?</h2>
          <p className="text-center text-gray mb-8">Everything you need for professional development</p>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="card p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={28} color="#1a5276" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Interactive Courses</h3>
              <p className="text-gray text-sm">
                Engaging content designed specifically for educators, with multimedia lessons and practical exercises.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: '#d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={28} color="#059669" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Learn at Your Pace</h3>
              <p className="text-gray text-sm">
                Access courses anytime, anywhere. Your progress is saved automatically so you can resume where you left off.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={28} color="#d97706" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Earn Certificates</h3>
              <p className="text-gray text-sm">
                Receive digitally signed certificates upon course completion, verifiable online for your portfolio.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={28} color="#dc2626" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
              <p className="text-gray text-sm">
                Your data is protected with industry-standard security. Only MOE staff can access the platform.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={28} color="#7c3aed" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
              <p className="text-gray text-sm">
                Monitor your learning journey with detailed progress tracking and performance analytics.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: '#fce7f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={28} color="#db2777" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Microsoft SSO</h3>
              <p className="text-gray text-sm">
                Sign in easily with your MOE Microsoft account. No need to remember another password.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Preview */}
      <section className="py-16" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <span className="badge badge-info mb-3">Featured Course</span>
              <h2 className="text-2xl font-bold mb-4">Demo for Testing Dec8, 25</h2>
              <p className="text-gray mb-6">
                A comprehensive training course designed for educators. Learn essential skills 
                and best practices through interactive modules and assessments.
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Interactive multimedia content',
                  'Self-paced learning modules',
                  'Progress tracking & bookmarking',
                  'Certificate upon completion'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 mb-2">
                    <CheckCircle size={18} color="#059669" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn btn-primary btn-lg mt-4">
                Enroll Now <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
              </Link>
            </div>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ 
                  aspectRatio: '16/9', 
                  backgroundColor: '#e2e8f0', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={64} color="#94a3b8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient" style={{ color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
          <p style={{ opacity: 0.9, marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Join thousands of educators who are already advancing their skills through our platform.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ backgroundColor: 'white', color: '#1a5276' }}>
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1e293b', color: 'white', padding: '2rem 0' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flex items-center gap-2">
              <BookOpen size={24} />
              <span className="font-semibold">MOE Learning Platform</span>
            </div>
            <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>
              © {new Date().getFullYear()} Ministry of Education - UAE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
