pipeline {
    agent any

    environment {
        APP_NAME = 'coffee-paradise'
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Pulling latest code from repository...'
                checkout scm
            }
        }

        stage('2. Code Lint & Verification') {
            steps {
                echo 'Checking application structure...'
                sh 'node -v'
                sh 'npm -v || true'
            }
        }

        stage('3. Build Docker Containers') {
            steps {
                echo 'Building Docker images for Express App and PostgreSQL...'
                sh 'docker compose build --no-cache'
            }
        }

        stage('4. Run & Deploy Application') {
            steps {
                echo 'Starting application containers...'
                sh 'docker compose down'
                sh 'docker compose up -d'
            }
        }

        stage('5. Health Check') {
            steps {
                echo 'Verifying app health on port 3000...'
                sleep 5
                sh 'curl -f http://localhost:3000 || exit 1'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! Coffee Paradise is live on http://localhost:3000'
        }
        failure {
            echo 'Pipeline failed. Check container logs using "docker compose logs".'
        }
    }
}