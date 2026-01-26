
# 𝓜𝓾𝓷𝓲𝓬𝓲𝓹𝓪𝓵𝓲𝓽𝔂 𝓜𝓪𝓷𝓪𝓰𝓮𝓶𝓮𝓷𝓽 & 𝓡𝓮𝓹𝓸𝓻𝓽𝓲𝓷𝓰 𝓢𝔂𝓼𝓽𝓮𝓶 𝓦𝓮𝓫 𝓐𝓹𝓹 - CITYCONNECT 
![tripoli-municipality](https://github.com/user-attachments/assets/fa96fa86-bd50-4a33-966e-3cf7b76ea967)
<img width="1307" height="612" alt="image" src="https://github.com/user-attachments/assets/0b7668a7-492e-434b-8ab3-4af8721ccfcf" />
<img width="1317" height="350" alt="image" src="https://github.com/user-attachments/assets/d5e6596f-96a9-4e6d-beef-69c5329e69ee" />



A comprehensive digital platform designed to bridge the gap between citizens and local authorities. This project allows citizens to report infrastructure issues and "Buildings at Risk," while providing city employees with a robust dashboard to manage, assign, and resolve these reports.

## **🚀 Features** 	

####  For Citizens
##### Report Issues: Submit reports for road damage, lighting issues, waste management, etc.
##### Buildings at Risk: A dedicated section to report and monitor structurally unsafe buildings.
##### Real-time Updates: Track the status of your reports from "Pending" to "Resolved."
##### Multilingual Support: Full support for English, French and Arabic (RTL).

#### For Municipality Employees

#### Management Dashboard: A centralized view to review incoming citizen reports.
##### Status Control: Update report statuses (e.g., Critical, Under Maintenance, Resolved).
##### Secure Access: Role-based access control (RBAC) ensuring only authorized staff can modify data.

#### **🛠️ Tech Stack**

Frontend: React (Vite), TypeScript, Tailwind CSS.

UI Components: Shadcn/UI, Lucide React.

Backend & Database: Supabase (PostgreSQL, Auth, Edge Functions).

State Management: React Context API & TanStack Query (Optimistic Updates).

Internationalization: i18next (English, French and Arabic).

#### ⚙️ Getting Started
Prerequisites
Node.js (v18+)


#### Supabase Account
Installation
##### Clone the repository:

###### Bash
```
git clone https://github.com/your-username/municipality-project.git

cd municipality-project
```
##### Install dependencies:
###### Bash
npm install

Environment Variables: 
Create a **.env** file in the root directory and add your Supabase credentials:

###### Code snippet
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Run the development server:

Bash
```
npm run dev
```
🔐 Security & Roles
The project uses Supabase Row Level Security (RLS).
Public: Can read issues and buildings reported.
Authenticated Citizens: Can create reports.

Employees: Can access the classify-report Edge Function to update statuses and assign personnel.

### Supabase Setup
This project uses a single Supabase Project as its backend.
Create a new project via the Supabase Dashboard and configure:
- Database tables
- Row Level Security (RLS)
- Authentication
- Edge Functions

Then copy the Project URL and Anon Key into your `.env` file.

#### 🤝 ** Contributing ** 
Fork the Project.

Create your Feature Branch 
```git checkout -b feature/AmazingFeature```

Commit your Changes
```git commit -m 'Add some AmazingFeature'```

Push to the Branch
```git push origin feature/AmazingFeature```

Open a Pull Request.
