#!/usr/bin/env groovy

node('rhel8'){
	stage('Checkout repo') {
		deleteDir()
		git url: 'https://github.com/camel-tooling/camel-lsp-client-vscode.git',
		    branch: 'main'
	}

	stage('Install requirements') {
		def nodeHome = tool 'nodejs-lts'
		env.PATH="${env.PATH}:${nodeHome}/bin"
		sh "node --version"
		sh "npm install -g typescript vsce"
	}

	stage('Build') {
		env.JAVA_HOME="${tool 'openjdk-11'}"
		env.PATH="${env.JAVA_HOME}/bin:${env.PATH}"
		sh "java -version"

		sh "npm ci"
		sh "npm run vscode:prepublish"
	}

	withEnv(['JUNIT_REPORT_PATH=report.xml']) {
        stage('Test') {
    		wrap([$class: 'Xvnc']) {
    			sh "npm test --silent"
    			junit 'report.xml'
    		}
        }
	}

	stage('Package') {
        def packageJson = readJSON file: 'package.json'
        sh "vsce package -o vscode-apache-camel-${packageJson.version}-${env.BUILD_NUMBER}.vsix --no-yarn"
        sh "npm pack && mv vscode-apache-camel-${packageJson.version}.tgz vscode-apache-camel-${packageJson.version}-${env.BUILD_NUMBER}.tgz"
	}

	if(params.UPLOAD_LOCATION) {
		stage('Snapshot') {
			def filesToPush = findFiles(glob: '**.vsix')
			sh "sftp -C ${UPLOAD_LOCATION}/snapshots/vscode-apache-camel/ <<< \$'put -p -r ${filesToPush[0].path}'"
            stash name:'vsix', includes:filesToPush[0].path
            def tgzFilesToPush = findFiles(glob: '**.tgz')
            stash name:'tgz', includes:tgzFilesToPush[0].path
            sh "sftp -C ${UPLOAD_LOCATION}/snapshots/vscode-apache-camel/ <<< \$'put -p -r ${tgzFilesToPush[0].path}'"
		}
    }
}

node('rhel8'){
	if(publishToMarketPlace.equals('true')){
		timeout(time:5, unit:'DAYS') {
			input message:'Approve deployment?', submitter: 'apupier,lheinema,joshiraez,tsedmik,djelinek'
		}

		stage("Publish to Marketplace") {
            unstash 'vsix'
            unstash 'tgz'
            withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
                def vsix = findFiles(glob: '**.vsix')
                sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
            }
            archiveArtifacts artifacts:"**.vsix,**.tgz"

            stage "Promote the build to stable"
            def vsix = findFiles(glob: '**.vsix')
            sh "sftp -C ${UPLOAD_LOCATION}/stable/vscode-apache-camel/ <<< \$'put -p -r ${vsix[0].path}'"

            def tgz = findFiles(glob: '**.tgz')
            sh "sftp -C ${UPLOAD_LOCATION}/stable/vscode-apache-camel/ <<< \$'put -p -r ${tgz[0].path}'"

            sh "npm install -g ovsx"
		    withCredentials([[$class: 'StringBinding', credentialsId: 'open-vsx-access-token', variable: 'OVSX_TOKEN']]) {
			    sh 'ovsx publish -p ${OVSX_TOKEN}' + " ${vsix[0].path}"
			}
        }
	}
}
