# NunVibe

A hybrid music recommendation system that combines content-based filtering with machine learning to provide personalized music recommendations. Built with FastAPI backend and React frontend.

## 🎵 Features

- **Genre-based Selection**: Choose from 1-3 music genres to start your recommendation journey
- **Sample Tracks**: Preview genre samples to refine your taste profile
- **Hybrid Recommendations**: Combines content-based KNN with logistic regression for personalized suggestions
- **Interactive Feedback**: Like/dislike tracks to improve future recommendations
- **Spotify Integration**: Embedded Spotify player for seamless music listening
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Get new recommendations based on your feedback

## 🏗️ Architecture

### Backend (FastAPI)
- **Hybrid Recommender**: Content-based KNN + Logistic Regression model
- **Data Processing**: Handles music features, genres, and user feedback
- **RESTful API**: Clean endpoints for genres, samples, and recommendations
- **Feedback System**: Collects and stores user preferences for model improvement

### Frontend (React + TypeScript)
- **Modern UI**: Clean, responsive interface with smooth transitions
- **Spotify Integration**: Embedded player for immediate music playback
- **State Management**: Efficient handling of user selections and feedback
- **Progressive Enhancement**: Step-by-step recommendation flow

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone git@github.com:Joumanasalahedin/nunvibe.git
   cd nunvibe
   ```

2. **Start the services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend Setup

1. **Navigate to the backend directory**
   ```bash
   cd app
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r ../requirements.txt
   ```

4. **Start the backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the frontend**
   - Open http://localhost:3000 in your browser

## 📁 Project Structure

```
nunvibe/
├── app/                    # Backend FastAPI application
│   ├── api/               # API routes and dependencies
│   ├── core/              # Configuration and settings
│   ├── data/              # Data preprocessing and loading
│   ├── schemas/           # Pydantic models for API
│   ├── services/          # Business logic (recommender, updater)
│   └── main.py           # FastAPI application entry point
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   └── App.tsx       # Main application component
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── scripts/              # Utility scripts
├── docker-compose.yml    # Docker orchestration
├── Dockerfile           # Backend container
└── requirements.txt     # Python dependencies
```

## 🔧 Configuration

### Environment Variables

The application uses the following configuration (see `app/core/config.py`):

- `API_PREFIX`: API route prefix (default: `/api`)
- `DEFAULT_K`: Default number of recommendations (default: 10)
- `MIN_FEEDBACK`: Minimum feedback required for ML model (default: 50)
- `CSV_PATH`: Path to music dataset
- `LR_MODEL_PATH`: Path to trained logistic regression model
- `FEEDBACK_CSV_PATH`: Path to user feedback storage

### API Endpoints

- `GET /api/genres` - List available music genres
- `GET /api/genres/samples` - Get sample tracks for selected genres
- `POST /api/recommend` - Get initial recommendations
- `POST /api/recommend/feedback` - Get refined recommendations based on feedback

## 🎯 How It Works

1. **Genre Selection**: Users select 1-3 music genres they enjoy
2. **Sample Preview**: System shows sample tracks from selected genres
3. **Initial Recommendations**: Content-based KNN provides first recommendations
4. **User Feedback**: Users like/dislike tracks to improve the model
5. **Hybrid Recommendations**: System combines user feedback with musical similarity
6. **Continuous Learning**: Feedback is stored to improve future recommendations

## 🛠️ Development

### Backend Development

- **API Documentation**: Available at http://localhost:8000/docs
- **Hot Reload**: Backend automatically restarts on code changes
- **Type Checking**: Uses Pydantic for request/response validation

### Frontend Development

- **Hot Reload**: Frontend automatically updates on code changes
- **TypeScript**: Full type safety for better development experience
- **ESLint**: Code linting and formatting

### Testing

```bash
# Backend tests
cd app
python -m pytest

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker

### Production Build

```bash
# Build and run production containers
docker-compose -f docker-compose.prod.yml up --build
```

### Development with Docker

```bash
# Start development environment
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 Data

The system uses a dataset of top 10,000 songs from 1950 to present, including:
- Track metadata (name, artist, genre)
- Musical features (tempo, energy, danceability, etc.)
- Genre classifications
- User feedback data

## 🆘 Support

If you encounter any issues or have questions:

1. Check the API documentation at http://localhost:8000/docs
2. Review the logs: `docker-compose logs`
3. Open an issue on GitHub

---

**NunVibe** - Discover your next favorite song! 🎶
