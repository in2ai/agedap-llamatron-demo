pipeline {
    agent {
        docker {
            image 'node:18.19.0'
            args '-u root:root'
        }
    }
    environment {
      GITHUB_TOKEN = credentials('AGEDAP_GH_TOKEN')
      APP_NAME_WIN = "agedap-llamatron-win32-x64-build-${env.BUILD_NUMBER}.zip"
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
            timeout(time: 1, unit: 'HOURS')
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
              script { // Windows
                sh 'npm run package-win'

                // Instalar zip si no lo tienes
                sh 'apt-get install -y p7zip-full'

                // Copy required files to the output directory
                sh """
                    cp -r public/ out/agedap-llamatron-win32-x64/
                    cp win/sharp-win32-x64.node out/agedap-llamatron-win32-x64/
                    cp win/libvips-cpp.dll out/agedap-llamatron-win32-x64/
                    cp win/libvips-42.dll out/agedap-llamatron-win32-x64/
                """

                // Crear el archivo zip
                sh """
                    cd out/
                    7z a -t7z -mx=9 ${APP_NAME_WIN} agedap-llamatron-win32-x64
                """
              }

              // Subir a GitHub Releases usando la GitHub CLI o cURL
              script {
                  def tagName = "build-${env.BUILD_NUMBER}"
                  def releaseName = "Release ${env.BUILD_NUMBER}"
                  echo "Creating release ${releaseName} with tag ${tagName}"

                  //Print current directory
                  sh 'pwd'
                  // Print the contents of the current directory
                  sh 'ls -la'
                  // Print the contents of the out directory
                  sh 'ls -la out/'

                  // Instalar gh cli (url: https://github.com/cli/cli/releases/download/v2.73.0/gh_2.73.0_linux_amd64.deb)
                 // Instalar GitHub CLI
                  sh '''
                      set -e
                      echo "Descargando GitHub CLI..."
                      curl -L -o gh.deb https://github.com/cli/cli/releases/download/v2.73.0/gh_2.73.0_linux_amd64.deb
                      dpkg -i gh.deb || apt-get install -f -y
                      rm gh.deb
                  '''

                  // Crear release y subir el artefacto (usando GitHub CLI)
                  withEnv(["GH_TOKEN=${GITHUB_TOKEN}"]) {
                      sh """
                          gh auth setup-git
                          gh release create ${tagName} --title "${releaseName}" --notes "Automated release from Jenkins" out/${APP_NAME_WIN}
                      """
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
