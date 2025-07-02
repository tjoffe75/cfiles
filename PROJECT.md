# Project cfiles: Goals and Guidelines

This document outlines the overall purpose, current status, future roadmap, and core development principles for the **cfiles** application.

---

## 🎯 Core Purpose and Goals

The primary purpose of **cfiles** is to provide a robust and secure platform for scanning files, with a focus on automated security checks and scalability.

**Key Project Goals:**
*   Secure file uploads.
*   Asynchronous, automatic virus and checksum scanning.
*   A centralized quarantine for infected or suspicious files.
*   A comprehensive admin panel for system configuration, monitoring, and management.
*   Support for Single Sign-On (SSO) and Role-Based Access Control (RBAC).
*   Downloadable scan reports.

---

## ✅ Current Status (July 2025)

The project has a stable end-to-end flow for secure file uploads, asynchronous virus scanning, and handling of infected files. All core functionality is in place.

**Implemented Features:**
*   **File Handling:** Users can upload files, which are then processed asynchronously. The system correctly identifies clean and infected files, moving the latter to a secure quarantine.
*   **Real-time UI:** The frontend provides real-time status updates for files being scanned.
*   **Admin Panel:** A fully functional admin panel allows for:
    *   **Dashboard:** System status overview.
    *   **Log Viewer:** Real-time application logs.
    *   **Quarantine Management:** Release or delete quarantined files.
    *   **Configuration:** Toggle features like Maintenance Mode and RBAC/SSO, and manage HTTPS certificates.
*   **Global Banners:** The UI displays global, non-intrusive banners to indicate the status of Maintenance Mode or if SSO is disabled.
*   **Modern UI/UX:** The interface is responsive, features a dark mode, and provides a consistent user experience.

---

## 🗺️ Project Roadmap

The following features are planned for future implementation:
*   Full integration with Active Directory for SSO/RBAC.
*   Generation and download of detailed scan reports.
*   Enhanced user and group management within the admin panel.

---

## ⚖️ Core Development Principles

All development in this project must adhere to the following principles:

1.  **Stability First:** No change should ever break existing functionality.
2.  **Modularity:** Write reusable, well-documented, and modular code. Avoid hard-coding and duplication.
3.  **Robustness:** Implement solid error handling for all operations (API calls, file handling, etc.).
4.  **Follow UI Design:** Adhere to the modern and consistent design language defined in the project.
5.  **"Devuser" for Development:** When `RBAC_SSO_ENABLED=false`, the backend automatically uses a "devuser" with full admin privileges for all operations. No `Authorization` headers should be sent in this mode.
6.  **Document Significant Changes:** Ensure that relevant documentation is updated when you implement a major change.
