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
          sh 'echo package hotshare'
          sh 'echo package hotshare end'
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
          sh './ios_auto_deploy.sh'
        }
      }
    }
    stage('PackageHotShareServer') {
      when {
        branch 'master'
      }
      steps {
        dir(path: 'hotShareWeb') {
          sh 'echo package hotshare server'
          sh 'echo package hotshare server end'
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
