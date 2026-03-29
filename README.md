
# 🐾 Pawpal - Pet Care & Rescue Community Platform

Pawpal is a comprehensive web application designed to connect pet owners, animal lovers, and service providers. It serves as a centralized hub for reporting lost or injured animals (SOS), finding veterinary clinics, and accessing essential pet care information.

## 📖 About The Project

Pawpal aims to create a supportive community for pets and their humans. Whether you've found a stray animal in need of help, are looking for the nearest vet, or just want to learn more about pet care, Pawpal provides the tools you need.

The platform features a secure user authentication system, interactive SOS reporting with real-time status updates ("Active", "In-Progress", "Resolved"), and a directory of pet clinics.

## ✨ Key Features

-   **🚨 SOS Reporting System**:
    -   Report lost, injured, or stray animals with details and location.
    -   **"I Can Help"**: Community members can volunteer to assist with specific reports.
    -   **Status Tracking**: Original reporters can update status to "Active", "In-Progress", or "Resolved".
-   **🔐 User Accounts**:
    -   Secure Sign Up and Login functionality.
    -   JWT-based authentication ensures secure sessions.
    -   User-specific dashboards to manage reported cases.
-   **🏥 Clinic Locator**:
    -   Find nearby veterinary clinics and pet hospitals.
    -   View details like address, contact info, and operating hours.
    -   Distance-based sorting to find the closest help.
-   **📘 Pet Info Hub**:
    -   Access valuable resources and guides on pet care, breeds, and health tips.
-   **🛍️ Pet Shops & Services** (Coming Soon):
    -   Directory for pet shops and hostels.

## 🛠️ Tech Stack

### Backend
-   **Language**: Java 17+
-   **Framework**: Spring Boot 3+ (Web, Data JPA, Security)
-   **Database**: MySQL
-   **Authentication**: JSON Web Tokens (JWT) & BCrypt Password Hashing
-   **Build Tool**: Maven

### Frontend
-   **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+)
-   **Styling**: Custom CSS with responsive design and status badges.
-   **Connectivity**: Fetch API for RESTful communication with the backend.

## ⚙️ Prerequisites

Before running the project, ensure you have the following installed:
-   **Java Development Kit (JDK) 17** or higher
-   **Maven** (or use the included `mvnw` wrapper)
-   **MySQL Server**

## 🚀 Getting Started

### 1. Database Setup
1.  Open your MySQL terminal or workbench.
2.  Create a new database named `pawpal`:
    ```sql
    CREATE DATABASE pawpal;
    ```
3.  Update your database credentials in `backend/src/main/resources/application.properties`:
    ```properties
    spring.datasource.username=your_username
    spring.datasource.password=your_password
    ```

### 2. Backend Setup
Navigate to the backend directory and run the application:
```bash
cd backend
# Using Maven Wrapper (Windows)
mvnw.cmd spring-boot:run

# Using Maven Wrapper (Linux/Mac)
./mvnw spring-boot:run
