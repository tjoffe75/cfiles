# cfiles - Secure File Scanning Platform

**cfiles** is a robust and secure platform for scanning files, focusing on automated security checks and scalability. It's built with a modern, containerized architecture using React, FastAPI, and Docker.

---

## 🚀 Getting Started

This project is fully containerized and managed by Docker Compose and helper scripts. **No manual installation of `npm` or `pip` packages is required.**

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- A shell environment (PowerShell on Windows, or Bash/Zsh on Linux/macOS).

### Installation & First Run

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd cfiles
    ```

2.  **Run the setup script:**
    This script will generate the necessary `.env` file, build all Docker containers, and start the application stack.

    -   On **Windows** (using PowerShell):
        ```powershell
        .\reset_env.ps1
        ```
    -   On **Linux/macOS**:
        ```bash
        ./reset_env.sh
        ```

3.  **Access the application:**
    Once the script is finished, the application will be available at:
    -   **`https://localhost`**
    -   **`https://cfiles.localhost`**

    The Traefik dashboard is also available at `http://localhost:8080`.

---

## 📚 Project Documentation

For a deeper understanding of the project, please refer to the following documents:

-   **[PROJECT.md](PROJECT.md):** Outlines the project's vision, goals, current status, and core principles.
-   **[ARCHITECTURE.md](ARCHITECTURE.md):** Provides a detailed technical overview of the system architecture, services, and data flow.
-   **[COPILOT_GUIDELINES.md](COPILOT_GUIDELINES.md):** Contains specific rules and instructions for AI-assisted development in this project.

---

## ⚙️ Environment Management

-   **To stop the application:**
    ```bash
    docker-compose down
    ```
-   **To reset and rebuild the entire environment:**
    Run the `reset_env` script for your OS as described in the installation section. This is the recommended way to apply configuration changes and ensure a clean state.
