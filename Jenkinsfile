pipeline {
  agent any
  stages {
    stage('BuildClient') {
      steps {
        dir(path: 'hotShareMobile') {
          sh './cleanbuild.sh'
          sh './build.sh'
        }
      }
    }
    stage('PackageHotShareClient') {
      when {
        branch 'master'
      }
      steps {
        dir(path: 'hotShareMobile') {
          sh './android_gen_apk.sh'
        }
      }
    }
    stage('PackageSharpAIClient') {
      when {
        branch 'sharpai'
      }
      steps {
        dir(path: 'hotShareMobile') {
          sh './android_gen_apk.sh'
        }
      }
    }
    stage('PackageHotShareServer') {
      when {
        branch 'master'
      }
      steps {
        dir(path: 'hotShareWeb') {
          sh './server_package.sh'
        }
      }
    }
    stage('PackageSharpAIServer') {
      when {
        branch 'sharpai'
      }
      steps {
        dir(path: 'hotShareWeb') {
          sh './server_package.sh'
        }
      }
    }
  }
}
