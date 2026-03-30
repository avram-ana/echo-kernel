## Echo Kernel

A mood-driven music recommendation app.
Users log their emotional state (text, color, intensity), and the system generates three song suggestions:

a matching track (aligned with the current mood)
a contrast track (opposite emotional direction)
a personalized track (based on user preferences)

Preferences are learned over time through a simple rating system, allowing recommendations to adapt dynamically to each user.

Built as a full-stack application with a focus on:

interactive UI and immersive design
user data handling and security
adaptive recommendation logic

Echo Kernel explores the intersection between emotion, user behavior, and algorithmic suggestion.

## Tech Stack

Frontend
Built with React (Vite) and Tailwind CSS v4.

Backend
Powered by Node.js and Express, handling authentication, business logic, and API routing. Uses bcrypt for secure authentication.

Database
Uses PostgreSQL with Prisma ORM for type-safe data access and relational data modeling (users, moods, recommendations, ratings).

API
RESTful API structure (/api/**) that connects frontend and backend, supporting authentication, mood logging, recommendation generation, ratings, and analytics.
