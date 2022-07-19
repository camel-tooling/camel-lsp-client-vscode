# How to start development

- call "npm install"
- right-click on the package.json and call "install dependencies"
- go to "Debug perspective" (Ctrl+Shift+D)
- select "Launch Camel LSP client extension"
- click on the green arrow

When testing new version of the Camel Language Server, just replace the jar in "jars" folder respecting the name "language-server.jar"

# How to provide a new version on VS Code Marketplace and OpenVSX Marketplace

* Check that the version in package.json has not been published yet
  * If already published:
    * Run 'npm version --no-git-tag-version patch' so that the version is updated
    * Push changes in a PR
    * Wait for PR to be merged
* Point to a release version of Camel Language Server. During development it can point to snapshots but for release it must be a released version.
  * The version used is mentioned in [scripts/postinstall.js](scripts/postinstall.js)
  * If a new release of Camel Language Server must be done, see [how to release it documentation](https://github.com/camel-tooling/camel-language-server/blob/main/Contributing.md#how-to-release)
  * To update the version from a SNAPSHOT to a released version, the Maven repository must be updated. You can check the file history to see how it was done.
* Check that someone listed as _submitter_ in Jenkinsfile is available
* Create a tag
* Push the tag to `camel-tooling/camel-lsp-client-vscode` repository, it will trigger a build after few minutes
* Check build is working fine on [Circle CI](https://app.circleci.com/pipelines/github/camel-tooling/camel-lsp-client-vscode)
* Start build on [Jenkins CI](https://studio-jenkins-csb-codeready.apps.ocp-c1.prod.psi.redhat.com/job/Fuse/job/VSCode/job/vscode-camel-lsp-release/) with _publishToMarketPlace_ and _publishToOVSX_ parameters checked
* Wait the build is waiting on step _Publish to Marketplace_
* For someone from _submitter_ list:
  * Ensure you are logged in
  * Go to the console log of the build and click "Proceed"
* Wait few minutes and check that it has been published on [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-apache-camel) and [Open VSX Marketplace](https://open-vsx.org/extension/redhat/vscode-apache-camel)
* Keep build forever for later reference and edit build information to indicate the version
* Prepare next iteration:
  * Run 'npm version --no-git-tag-version patch' to update the version
  * Push changes in a PR
  * Follow PR until it is approved/merged
* It is often interesting to move to next SNAPSHOT version of the Camel Language Server
