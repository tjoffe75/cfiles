import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SSOBanner.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SSOBanner = () => {
  const [ssoStatus, setSsoStatus] = useState({ enabled: true });
  useEffect(() => {
    axios.get(`${API_URL}/config/sso-status`).then(resp => {
      setSsoStatus(resp.data);
    }).catch(() => {
      setSsoStatus({ enabled: false });
    });
  }, []);

  if (ssoStatus.enabled) return null;
  return (
    <div className="sso-banner">
      <span className="sso-icon" role="img" aria-label="info">ℹ️</span>
      SSO/RBAC is <b>OFF</b> (Development mode): The application is not protected by AD/SSO. All users have full access.
    </div>
  );
};

export default SSOBanner;
