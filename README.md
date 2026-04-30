🚀 AI Web App
  A full-stack AI-powered web application built using Spring Boot, integrated with Groq API for high-speed LLM responses, and backed by a cloud-hosted Aiven database.

🌐 Live Demo: [https://aiapp-jjj1.onrender.com/index.html](https://aiapp-jjj1.onrender.com/index.html)
☁️ Deployed on: Render

📌 About the Project
    This application enables users to interact with an AI system through a web interface. User prompts are processed by the backend and sent to the Groq API, and         responses are returned in real time.All interactions are stored in a managed cloud database (Aiven), ensuring persistence and scalability.

🔥 Key Features
    ⚡ AI-powered chat system (Groq API)
    🔐 User authentication (Signup / Login)
    📜 Chat history stored in cloud database
    👥 Role-based system (User + Admin)
    🛠️ Admin dashboard
    🧱 Clean layered backend architecture
    🛡️ Spring Security integration

🧠 Functionality
    Secure user registration and login
    AI prompt submission and response handling
    Backend processes requests and calls Groq API
    Responses are returned instantly
    Conversations are stored and retrievable
    Admin can manage users and monitor activity

🏗️ System Architecture
    Frontend (HTML / CSS / JS)
            ↓
    Spring Boot Controllers
            ↓
    Service Layer (AI + Logic)
            ↓
    Repository Layer (JPA)
            ↓
    Aiven Cloud Database (MySQL)
            ↓
    Groq API (LLM)


📂 Project Structure
    Backend     
      controller/ → API endpoints
      service/ → AI + business logic
      repository/ → database access
      entity/ → data models
      dto/ → request/response contracts
      config/ → security setup
      exception/ → global error handling
    Frontend
      index.html → main UI
      login.html, signup.html → authentication
      history.html → chat history
      admin.html → admin panel
      JS + CSS for interaction

🔄 Application Flow
    1. User logs in or signs up
    2. Sends prompt through UI
    3. Backend processes request
    4. Groq API generates response
    5. Data stored in Aiven database
    6. Response displayed on frontend
    7. History available for users
    
⚙️ Tech Stack
    Backend: Java, Spring Boot, Spring Security, JPA
    Frontend: HTML, CSS, JavaScript, Bootstrap
    Database: Aiven Cloud (MySQL)
    AI: Groq API
    Deployment: Render

🧩 Engineering Highlights
    Layered architecture for scalability
    DTO-based API design
    Centralized exception handling
    Secure authentication configuration
    Cloud-native database usage
    AI service abstraction

🚀 Deployment
    Application hosted on Render
    Database managed via Aiven Cloud
    AI responses powered by Groq API    

⭐ Summary
    A complete AI-integrated full-stack system demonstrating backend architecture, cloud database usage, and real-time AI processing.


