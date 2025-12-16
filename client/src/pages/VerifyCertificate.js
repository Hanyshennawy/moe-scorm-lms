import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Award, Calendar, User, BookOpen, Loader } from 'lucide-react';
import api from '../services/api';

const VerifyCertificate = () => {
  const { certificateNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyCertificate();
  }, [certificateNumber]);

  const verifyCertificate = async () => {
    try {
      const response = await api.get(`/certificates/verify/${certificateNumber}`);
      setCertificate(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <Loader size={48} color="#1a5276" className="animate-spin mx-auto mb-4" />
          <p className="text-gray">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#f8fafc' }}>
      <div className="container max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'linear-gradient(135deg, #1a5276 0%, #2874a6 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={28} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a5276' }}>
              MOE Learning
            </span>
          </Link>
        </div>

        {error ? (
          <div className="card">
            <div className="card-body p-8 text-center">
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <XCircle size={40} color="#dc2626" />
              </div>
              <h1 className="text-2xl font-bold mb-3" style={{ color: '#dc2626' }}>
                Certificate Not Found
              </h1>
              <p className="text-gray mb-4">{error}</p>
              <p className="text-sm text-gray">
                Certificate Number: <strong>{certificateNumber}</strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body p-8">
              {/* Verified Badge */}
              <div className="text-center mb-6">
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: '#d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <CheckCircle size={40} color="#059669" />
                </div>
                <span className="badge badge-success mb-2">Verified</span>
                <h1 className="text-2xl font-bold">Certificate is Valid</h1>
              </div>

              {/* Certificate Details */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div className="text-center mb-4">
                  <Award size={48} color="#d97706" style={{ margin: '0 auto 0.5rem' }} />
                  <h2 className="text-lg font-semibold">{certificate.course_title}</h2>
                  <p className="text-sm text-gray">Certificate of Completion</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={18} color="#64748b" />
                    <div>
                      <p className="text-xs text-gray">Awarded To</p>
                      <p className="font-medium">{certificate.user_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar size={18} color="#64748b" />
                    <div>
                      <p className="text-xs text-gray">Issue Date</p>
                      <p className="font-medium">
                        {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Award size={18} color="#64748b" />
                    <div>
                      <p className="text-xs text-gray">Certificate Number</p>
                      <p className="font-medium" style={{ fontFamily: 'monospace' }}>
                        {certificate.certificate_number}
                      </p>
                    </div>
                  </div>

                  {certificate.score && (
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} color="#64748b" />
                      <div>
                        <p className="text-xs text-gray">Final Score</p>
                        <p className="font-medium">{certificate.score}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Signature */}
              {certificate.digital_signature && (
                <div className="text-center text-xs text-gray" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <p>This certificate is digitally signed and verified.</p>
                  <p className="mt-1" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    Signature: {certificate.digital_signature.substring(0, 32)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray mt-6">
          Ministry of Education - UAE<br />
          Learning Management System
        </p>
      </div>
    </div>
  );
};

export default VerifyCertificate;
