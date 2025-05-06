pipeline {
    agent any
    tools {
        nodejs "NodeJS" // Specify the NodeJS installation name in Jenkins
    }
    stages {
        stage('Build') {
            steps {
                script {
                    // Check if the build is triggered by a pull request
                    if (env.CHANGE_ID) {
                        echo "Building pull request #${env.CHANGE_ID}"
                    } else {
                        echo "Building branch ${env.BRANCH_NAME}"
                    }
                }
                sh 'npm install'
                sh 'npm run build-pro'
            }
        }

        stage('Test') {
            steps {
                script {
                    // Check if the build is triggered by a pull request
                    if (env.CHANGE_ID) {
                        echo "Running tests for pull request #${env.CHANGE_ID}"
                    } else {
                        echo "Running tests for branch ${env.BRANCH_NAME}"
                    }
                }
                sh 'npm run test -- --watch=false --bail --code-coverage'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Check if the build is triggered by a pull request
                    if (env.CHANGE_ID) {
                        echo "Skipping deployment for pull request #${env.CHANGE_ID}"
                    } else {
                        echo "Deploying branch ${env.BRANCH_NAME} (TO-DO)"
                        //sh 'npm run deploy'
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/coverage/**', fingerprint: true
            junit '**/test-results/**/*.xml'
        }
    }
}
