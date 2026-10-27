pipeline {
    agent any

    environment {
        APP_NAME = 'coffee-paradise'
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
        // Azure VM Host Credentials / IP Addresses defined in Jenkins Global Variables
        DEV_VM_SSH  = 'azureuser@dev.coffeeparadise.internal'
        TEST_VM_SSH = 'azureuser@test.coffeeparadise.internal'
        PROD_VM_SSH = 'azureuser@prod.coffeeparadise.internal'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Pulling latest code from GitHub...'
                checkout scm
            }
        }

        stage('2. Static Analysis & Code Linting') {
            steps {
                echo 'Running HTMLHint static analysis on HTML templates...'
                sh 'npx htmlhint "**/*.html"'
            }
        }

        stage('3. Build Docker Containers') {
            steps {
                echo 'Building Docker images for Express App and PostgreSQL...'
                sh 'docker compose build --no-cache'
            }
        }

        stage('4. Deploy to Dev VM') {
            steps {
                echo 'Deploying containerized services to Azure Development VM...'
                sh "ssh -o StrictHostKeyChecking=no ${DEV_VM_SSH} 'cd /app && docker compose down && docker compose up -d --build'"
            }
        }

        stage('5. Deploy to Staging & Run Cypress E2E Tests') {
            steps {
                echo 'Deploying to Azure Staging/Test VM...'
                sh "ssh -o StrictHostKeyChecking=no ${TEST_VM_SSH} 'cd /app && docker compose down && docker compose up -d --build'"
                
                echo 'Running Cypress E2E UI Tests (Login, Register, DB, Stripe)...'
                sh 'npx cypress run --config baseUrl=http://test.coffeeparadise.internal:3000'
            }
        }

        stage('6. Promote & Deploy to Production VM') {
            steps {
                echo 'Cypress tests passed! Promoting validated release to Azure Production VM...'
                sh "ssh -o StrictHostKeyChecking=no ${PROD_VM_SSH} 'cd /app && docker compose down && docker compose up -d --build'"
            }
        }

        stage('7. Production Health Check') {
            steps {
                echo 'Verifying Live Application Endpoint...'
                sleep 5
                sh "curl -f http://prod.coffeeparadise.internal:3000 || exit 1"
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deployment successful! Coffee Paradise is live on Production VM.'
        }
        failure {
            echo 'Pipeline failed! Check Jenkins console output logs.'
        }
    }
}