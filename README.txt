====================================================================
PROJECT: Understand Deen 
DELIVERABLE: 2 - Login & Signup Pages (Fully Functional with DB)
====================================================================

GROUP MEMBERS:
1. Muhammad Waqar Saleem (23L-1021)
2. Ali Hassan (23L-0916)
3. Ahmed Siddique (23L-0819)

TECH STACK:
- Frontend: React.js, Tailwind CSS, Vite
- Backend: Node.js, Express.js
- Database: MS SQL Server (via Windows Authentication)

* NOTE ON DATABASE: As per official approval, this project utilizes 
MS SQL Server instead of MySQL to better align with enterprise 
standards and our current coursework.

====================================================================
SETUP & RUN INSTRUCTIONS
====================================================================
Please follow these steps in exact order to run the application locally. 
Note: 'node_modules' folders have been excluded from this submission 
as per the deliverable instructions.

--------------------------------------------------
STEP 1: DATABASE SETUP (SSMS)
--------------------------------------------------
1. Open Microsoft SQL Server Management Studio (SSMS).
2. Connect to your local SQL Server instance using Windows Authentication.
3. Go to File > Open > File... and open the `database/UnderstandDeenDB.sql` script.
4. Click "Execute" (or press F5) to build the database, tables, constraints, stored procedures, and seed data.

--------------------------------------------------
STEP 2: BACKEND SETUP (Node.js)
--------------------------------------------------
1. Open a terminal and navigate to the `backend` folder.
2. Run the following command to install required dependencies:
   npm install
3. IMPORTANT: Check the `.env` file in the backend folder. Ensure the `DB_SERVER` variable matches your local SQL Server instance name (e.g., localhost\SQLEXPRESS).
4. Run the following command to start the API server:
   npm run dev
5. You should see "[DB] Connected to UnderstandDeenDB via Windows Authentication." in the console. Leave this terminal running.

--------------------------------------------------
STEP 3: FRONTEND SETUP (React.js)
--------------------------------------------------
1. Open a second, separate terminal and navigate to the `frontend` folder.
2. Run the following command to install the UI dependencies:
   npm install
3. Run the following command to start the React application:
   npm run dev
4. Ctrl + Click the local URL provided in the terminal (usually http://localhost:5173) to open the app in your browser.

====================================================================
TESTING THE FLOW
====================================================================
- Validation: Try submitting empty forms or weak passwords (e.g., "123") to see real-time frontend validation.
- Duplicate Emails: The backend prevents duplicate email registrations at the database level using Stored Procedures and will return a specific 409 error to the UI.
- Success Flow: Upon successful signup or login, the system generates a secure JWT and redirects the user to the protected `/dashboard` route.
- Protected Routes: Attempting to visit `/login` while logged in will bounce the user back to the dashboard, and visiting `/dashboard` while logged out will redirect to the login page.