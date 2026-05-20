# Staff Management System Project Report

## Title Page

**Project Title:** Staff Management System  
**Domain:** Academic Administration and Examination Management  
**Institution:** Veermata Jijabai Technological Institute (VJTI), MCA Department  
**Technology Stack:** React.js, Node.js, Express.js, MongoDB, Mongoose, Bootstrap, jsPDF  
**Submitted By:** [Student Name]  
**Roll Number:** [Roll Number]  
**Guide:** [Guide Name]  
**Academic Year:** [Academic Year]

## Certificate

This is to certify that the project titled **Staff Management System** has been developed as part of the academic project work for the MCA program. The project demonstrates the design and implementation of a web-based system for managing teaching and non-teaching staff records, examination duties, charge-sheet generation, role-based access, and report preparation.

## Acknowledgement

I would like to express my sincere gratitude to my project guide, faculty members, and the MCA department for their guidance and support throughout the development of this project. I also thank everyone who provided feedback during the design and testing of the system.

## Abstract

The Staff Management System is a web-based application designed to support staff record management and examination-related administrative workflows. The system allows authorized users to manage teaching and non-teaching staff data, maintain task rates, create examination charge-sheet entries, generate reports, manage timetable details, and track approval status for monthly work records.

The project uses a React.js frontend and an Express.js backend connected to MongoDB through Mongoose. The application includes authentication, password change through OTP verification, role-based page access, staff photo uploads, PDF generation, charge-sheet total calculation, and monthly approval workflows. The system reduces manual record handling and improves accuracy, transparency, and accessibility in staff payment and examination duty management.

## Table of Contents

1. Introduction  
2. Existing System  
3. Proposed System  
4. Objectives  
5. Scope of the Project  
6. Technology Stack  
7. System Architecture  
8. Modules of the System  
9. Database Design  
10. API Design  
11. Functional Workflow  
12. Security and Access Control  
13. Testing  
14. Advantages  
15. Limitations  
16. Future Enhancements  
17. Conclusion

## 1. Introduction

Educational departments often need to manage staff details, examination duties, remuneration records, and approval workflows. These tasks are traditionally handled using spreadsheets, paper forms, and manual calculations. Such an approach can lead to duplicate work, calculation mistakes, difficulty in tracking status, and delays in preparing reports.

The Staff Management System addresses these issues by providing a centralized digital platform. It supports staff profile management, examination charge-sheet preparation, task rate configuration, timetable PDF generation, and summary report creation. The application is especially suited for department-level administration where teaching and non-teaching staff data must be maintained accurately.

## 2. Existing System

In a manual or semi-manual system, staff details and examination duties are usually maintained in registers, spreadsheets, or separate files. Charge-sheet amounts may be calculated manually, and approval status may be tracked through verbal communication or separate documents.

Common problems in the existing system include:

- Repeated entry of staff and examination data.
- Higher chances of calculation errors.
- Difficulty in filtering teaching and non-teaching staff.
- Lack of centralized approval status.
- Time-consuming report and PDF preparation.
- Limited access control between administrative roles.

## 3. Proposed System

The proposed system is a full-stack web application that centralizes staff and examination-related data. It allows authorized users to log in, add staff members, maintain charge-sheet entries, generate reports, and approve monthly records.

The system provides:

- A React-based user interface for staff and examination workflows.
- An Express.js REST API for backend operations.
- MongoDB database storage using Mongoose schemas.
- Role-based access for admin, HOD, and examination committee users.
- PDF generation for reports, staff lists, charge sheets, and timetables.
- OTP-based password change functionality using email configuration.

## 4. Objectives

The main objectives of the project are:

- To maintain a centralized database of teaching and non-teaching staff.
- To simplify staff addition, update, deletion, and listing.
- To support staff photo upload and storage.
- To calculate examination-related remuneration accurately.
- To generate charge-sheet and report data month-wise.
- To provide role-based access to sensitive pages and actions.
- To support HOD approval and account processing workflows.
- To reduce manual paperwork and administrative effort.

## 5. Scope of the Project

The scope of the project includes staff record management, task and rate configuration, charge-sheet entry, dashboard reporting, timetable generation, and authentication. The system is intended for department-level usage and can be extended for institution-wide deployment.

The current implementation covers:

- Staff management for teaching and non-teaching categories.
- Charge-sheet creation for examination work.
- Month-wise report generation.
- HOD approval of monthly pending charge sheets.
- Accounts page for approved entries.
- Timetable creation and PDF export.
- Task rate management through browser local storage.
- Authentication for predefined authorized users.

## 6. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js | User interface and page routing |
| Styling | CSS, Bootstrap | Responsive and styled layouts |
| Routing | React Router | Client-side route handling |
| HTTP Client | Axios | API communication |
| Backend | Node.js, Express.js | REST API and server logic |
| Database | MongoDB | Persistent document storage |
| ODM | Mongoose | Schema modeling and database access |
| File Upload | Multer | Staff photo upload handling |
| Authentication | bcryptjs | Password hashing and verification |
| Email/OTP | Nodemailer, Brevo API support | OTP delivery for password change |
| PDF Export | jsPDF, jsPDF AutoTable | Report and timetable PDF generation |

## 7. System Architecture

The application follows a client-server architecture.

The frontend is built in React and communicates with backend APIs using Axios. The backend is built using Express.js and exposes REST endpoints for staff, authentication, task, assignment, charge-sheet, report, and month approval operations. MongoDB stores persistent data, and Mongoose models define the structure of each collection.

Basic architecture flow:

1. User accesses the React application through a browser.
2. React pages send HTTP requests to the Express API.
3. Express routes validate and process the request.
4. Controllers or route handlers interact with MongoDB through Mongoose models.
5. The backend returns JSON responses.
6. The frontend updates the interface and optionally generates PDFs.

## 8. Modules of the System

### 8.1 Authentication Module

The authentication module allows only predefined authorized users to log in. User passwords are stored in hashed form using bcrypt. The system supports OTP-based password change. OTPs can be sent using Brevo API, SMTP settings, or logged to the console if mail settings are unavailable.

Main features:

- Authorized email validation.
- Default user seeding for admin, HOD, and exam committee.
- Password verification using bcrypt.
- OTP request, OTP verification, and password change.
- Session storage of logged-in user details.

### 8.2 Staff Management Module

This module manages staff profiles. It supports adding new staff, viewing all staff, updating staff details, deleting staff records, and storing staff photographs.

Staff details include:

- Name
- Phone number
- Email
- Department
- Designation
- Staff type
- Employee ID
- Photo filename

### 8.3 Teaching and Non-Teaching Directory Module

The frontend provides separate pages for teaching and non-teaching staff. The reusable staff directory component supports searching, filtering by department, sorting, grid/table views, editing, deleting, and PDF export.

### 8.4 Charge-Sheet Module

The charge-sheet module records examination-related work for staff members. It includes fields such as academic year, semester, exam type, exam month, course details, paper setting count, assessment count, exam conduction amount, invigilation amount, duty role, duty dates, duty days, and duty rate.

The backend calculates total amount using:

- Paper setting amount.
- Assessment amount.
- Exam conduction amount.
- Invigilation amount.
- Duty amount.

For Re-ESE entries, paper setting amount is treated as zero and assessment amount follows a minimum amount rule when assessments exist.

### 8.5 Dashboard and Report Module

The dashboard displays month-wise report information. It fetches summarized data from the report API and charge-sheet entries from the charge-sheet API. The dashboard shows totals for teaching and non-teaching staff, grand total, paper counts, assessment counts, and detailed entries.

It also supports:

- Entry editing and deletion.
- Status display.
- HOD approval for monthly records.
- Charge-sheet PDF generation.
- Excel-style workbook generation through frontend utilities.

### 8.6 Month Approval Module

The month approval module stores approval status for a selected month. When a month is approved by the HOD, pending charge-sheet entries for that month are updated to `Approved_by_HOD`.

### 8.7 Accounts Module

The accounts page displays approved charge-sheet records and supports status updates for account processing. It also supports PDF download for approved payment details.

### 8.8 Timetable Module

The timetable module allows users to prepare theory examination timetables, supervision schedules, and lab examination schedules. It supports saving timetable data locally and exporting PDF documents using jsPDF and AutoTable.

### 8.9 Task Rates Module

The task rates page allows admin/HOD users to manage configurable rates for paper setting, assessment, and duty roles. These values are stored in browser local storage and used by charge-sheet calculations on the frontend.

## 9. Database Design

### 9.1 Staff Collection

| Field | Type | Description |
|---|---|---|
| name | String | Staff member name |
| phone | String | Contact number |
| email | String | Email address |
| department | String | Department name |
| designation | String | Staff designation |
| type | String | Teaching or non-teaching |
| empId | String | Employee ID |
| photo | String | Uploaded photo filename |
| timestamps | Date | Created and updated timestamps |

### 9.2 User Collection

| Field | Type | Description |
|---|---|---|
| name | String | User display name |
| email | String | Unique login email |
| password | String | Hashed password |
| role | String | admin, hod, or exam_committee |
| mustChangePassword | Boolean | Indicates whether password change is required |
| passwordResetOtpHash | String | Hashed OTP |
| passwordResetOtpExpiresAt | Date | OTP expiry time |
| passwordResetOtpVerified | Boolean | OTP verification status |
| passwordChangedAt | Date | Last password change time |

### 9.3 Chargesheet Collection

| Field | Type | Description |
|---|---|---|
| month | String | Selected report month |
| staffId | ObjectId | Reference to staff |
| staffName | String | Staff name at entry time |
| designation | String | Staff designation |
| academicYear | String | Academic year |
| semester | String | Semester |
| examType | String | MST, ESE, or Re-ESE |
| courseCode | String | Course code |
| courseTitle | String | Course title |
| paperSets | Number | Number of paper sets |
| paperSetRate | Number | Rate per paper set |
| assessments | Number | Number of assessments |
| assessmentRate | Number | Rate per assessment |
| examConduction | Number | Exam conduction amount |
| invigilation | Number | Invigilation amount |
| dutyRole | String | Duty role name |
| dutyDates | String | Selected duty dates |
| dutyDays | Number | Number of duty days |
| dutyRate | Number | Rate per duty day |
| dutyAmount | Number | Duty amount |
| total | Number | Total calculated amount |
| status | String | Pending, Approved_by_HOD, or further status |

### 9.4 Task Collection

| Field | Type | Description |
|---|---|---|
| name | String | Task name |
| rate | Number | Task rate |
| type | String | Teaching or Non-Teaching |

### 9.5 Assignment Collection

| Field | Type | Description |
|---|---|---|
| staffId | ObjectId | Staff reference |
| taskId | ObjectId | Task reference |
| quantity | Number | Task quantity |
| totalAmount | Number | Calculated total amount |

### 9.6 Month Status Collection

| Field | Type | Description |
|---|---|---|
| month | String | Month identifier |
| status | String | Current approval status |
| approvedBy | String | Approving user |
| approvedAt | Date | Approval timestamp |

## 10. API Design

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/login | Login authorized user |
| POST | /api/auth/request-password-otp | Request password change OTP |
| POST | /api/auth/verify-password-otp | Verify OTP |
| POST | /api/auth/change-password | Change password |
| GET | /api/staff | Fetch all staff |
| POST | /api/staff | Add staff |
| PUT | /api/staff/:id | Update staff |
| DELETE | /api/staff/:id | Delete staff |
| GET | /api/chargesheet | Fetch charge-sheet entries |
| POST | /api/chargesheet | Create charge-sheet entry |
| PUT | /api/chargesheet/:id | Update charge-sheet entry |
| DELETE | /api/chargesheet/:id | Delete charge-sheet entry |
| PUT | /api/chargesheet/status/:id | Update charge-sheet status |
| GET | /api/report | Generate report summary |
| POST | /api/month/approve | Approve all pending entries for a month |
| GET | /api/task | Fetch tasks |
| POST | /api/task | Add task |
| DELETE | /api/task/:id | Delete task |
| GET | /api/assign | Fetch assignments |
| POST | /api/assign | Assign task |

## 11. Functional Workflow

### 11.1 Login Workflow

1. User enters email and password.
2. Backend checks whether the email is authorized.
3. Password is compared with the stored bcrypt hash.
4. On success, user data is returned to the frontend.
5. If password change is required, user is redirected to the password change page.

### 11.2 Add Staff Workflow

1. User enters staff information and optionally uploads a photo.
2. Frontend sends multipart form data to the staff API.
3. Multer stores the uploaded image in the uploads folder.
4. Staff details are saved in MongoDB.
5. User receives confirmation after successful insertion.

### 11.3 Charge-Sheet Workflow

1. User selects staff and examination details.
2. User enters workload counts, duty role, and duty dates.
3. Frontend calculates preview totals.
4. Backend validates and recalculates total amount.
5. Entry is saved with pending status.
6. Dashboard displays the entry in the selected month.

### 11.4 Approval Workflow

1. HOD selects a month on the dashboard.
2. HOD approves the month.
3. Month status is saved or updated.
4. Pending charge-sheet entries for that month become approved.
5. Accounts can process approved entries.

### 11.5 Report Generation Workflow

1. User selects the required month.
2. Dashboard calls the report API.
3. Backend fetches staff and charge-sheet records.
4. Backend calculates teaching total, non-teaching total, grand total, paper count, and assessment count.
5. Frontend displays summary cards and detailed records.
6. User can export generated PDF documents.

## 12. Security and Access Control

The system includes basic security controls:

- Passwords are hashed using bcrypt.
- Only predefined authorized email IDs can log in.
- OTP verification is used for password changes.
- React route guards protect authenticated pages.
- Role-based route guards restrict selected pages to admin and HOD users.
- MongoDB credentials are loaded through environment variables.

The project currently uses session storage on the frontend for user state. For production-level security, token-based authentication such as JWT and backend authorization middleware should be added.

## 13. Testing

Testing was performed at functional and integration levels.

### Functional Testing

| Test Case | Expected Result |
|---|---|
| Login with authorized email and valid password | User logs in successfully |
| Login with unauthorized email | Access is denied |
| Add staff with required fields | Staff is saved successfully |
| Add staff with missing required fields | Validation error is shown |
| Upload staff photo | Image is stored in uploads folder |
| Create charge-sheet entry | Entry is saved and total is calculated |
| Edit charge-sheet entry | Entry updates and total recalculates |
| Delete charge-sheet entry | Entry is removed |
| Approve month | Pending entries become Approved_by_HOD |
| Generate report | Summary totals and detailed entries are displayed |
| Generate timetable PDF | PDF is downloaded |

### Integration Testing

The frontend was tested with backend API endpoints to verify data flow between React pages, Express routes, and MongoDB collections. Staff records, charge-sheet entries, and report summaries were checked across creation, update, retrieval, and deletion operations.

## 14. Advantages

- Centralized management of staff and examination work records.
- Reduced manual calculation effort.
- Better organization of teaching and non-teaching staff data.
- Faster generation of reports and PDFs.
- Role-based access for administrative users.
- Month-wise tracking of approval status.
- Reusable frontend components for staff directories.
- Extensible backend structure using Express routes and Mongoose models.

## 15. Limitations

- Frontend API base URL is hardcoded to the deployed Render backend.
- Some role names in frontend routes may need alignment with backend roles before production deployment.
- Task rate configuration is stored in browser local storage rather than the database.
- Authentication does not currently use JWT or secure HTTP-only cookies.
- Backend authorization middleware is not implemented for every protected API.
- The current report design depends on available charge-sheet and staff data.

## 16. Future Enhancements

Future versions can include:

- JWT-based authentication and backend route authorization.
- Database-backed task rate management.
- Full accounts workflow with payment tracking.
- Audit trail for changes and approvals.
- Advanced analytics charts on dashboard.
- Export to Excel for staff and charge-sheet data.
- Email notifications for approvals and status changes.
- Institution-wide multi-department support.
- Improved validation with schema-level constraints.
- Cloud storage for uploaded staff photographs.

## 17. Conclusion

The Staff Management System successfully provides a digital solution for managing staff records, examination duties, charge sheets, approvals, and reports. By using React.js, Express.js, MongoDB, and supporting libraries, the system offers a practical and extensible platform for academic administration.

The project reduces paperwork, improves calculation accuracy, supports role-based workflows, and enables quick generation of PDF reports and timetables. With further enhancements such as JWT authentication, database-backed configuration, and stronger audit features, the system can be expanded into a complete institutional staff and examination management platform.
