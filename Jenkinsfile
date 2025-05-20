pipeline {
    agent {
        docker {
            image 'node:18.19.0'
            args '-u root:root'
        }
    }
    stages {
        stage('Build: Install dependencies') {
            steps {
                sh '''#!/bin/bash
                    set -x  # Enables debug mode

                    apt-get update
                    apt-get install -y nodejs
                    npm install -g @angular/cli@latest
                '''

                //Install chrome browser
                sh '''#!/bin/bash
                    set -x  # Enables debug mode

                    apt-get update
                    apt-get install -y wget unzip
                    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
                    dpkg -i google-chrome-stable_current_amd64.deb || true
                    apt-get install -f -y
                '''

                // Set the CHROME_BIN environment variable to the path of the Chrome binary
                script {
                    env.CHROME_BIN = '/usr/bin/google-chrome'
                    echo "CHROME_BIN set to ${env.CHROME_BIN}"
                }
            }
        }
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
                sh 'npm install --force'
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
                sh 'ng test --code-coverage --watch=false --browsers=ChromeHeadless'
            }
        }
        stage('Package & Release') {
          when {
              expression { !env.CHANGE_ID && env.BRANCH_NAME == 'main' } // solo para main y no en PRs
          }
          steps {
              script {
                  echo "Packaging Electron app..."
              }

              // Ejecutar el empaquetado
              // Windows
              sh 'npm run package-win'

              // Instalar zip si no lo tienes
              sh 'apt-get install -y zip'

              // Crear el archivo zip
              sh '''
                  cd out/
                  zip -r app.zip *
              '''

              // Subir a GitHub Releases usando la GitHub CLI o cURL
              withCredentials([string(credentialsId: 'GITHUB_TOKEN', variable: 'GH_TOKEN')]) {
                  script {
                      def tagName = "build-${env.BUILD_NUMBER}"
                      def releaseName = "Release ${env.BUILD_NUMBER}"

                      // Crear release y subir el artefacto (usando GitHub CLI)
                      sh '''
                          apt-get install -y curl jq
                          curl -sL https://github.com/cli/cli/releases/latest/download/gh_2.49.0_linux_amd64.deb -o gh.deb
                          dpkg -i gh.deb || true
                          apt-get install -f -y

                          gh auth login --with-token <<< "$GH_TOKEN"

                          gh release create ${TAG_NAME} out/app.zip --title "${RELEASE_NAME}" --notes "Automated release from Jenkins"
                      '''
                  }
              }
          }
      }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/coverage/**', fingerprint: true
        }
    }
}
