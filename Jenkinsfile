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
                        echo "Building"
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
                        echo "Running tests"
                    }
                }
                sh 'ng test --code-coverage --watch=false --browsers=ChromeHeadless'
            }
        }
        stage('Package & Release') {
          options {
            timeout(time: 10, unit: 'MINUTES')
          }
          when {
              expression { !env.CHANGE_ID } // no en PRs
          }
          steps {
              script {
                  echo "Packaging Electron app..."
              }

              // Rm old out/ if exists
              sh 'rm -rf out/'

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
              script {
                  def ghToken = "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"
                  def tagName = "build-${env.BUILD_NUMBER}"
                  def releaseName = "Release ${env.BUILD_NUMBER}"
                  echo "Creating release ${releaseName} with tag ${tagName}"

                  // Instalar gh cli
                  sh '''
                      type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)
                      sudo mkdir -p -m 755 /etc/apt/keyrings
                      out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg
                      cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
                      sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
                      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
                      sudo apt update
                      sudo apt install gh -y
                  '''

                  // Crear release y subir el artefacto (usando GitHub CLI)
                  sh '''
                      gh auth login --with-token <<< "${ghToken}"

                      gh release create ${tagName} out/app.zip --title "${releaseName}" --notes "Automated release from Jenkins"
                  '''
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
