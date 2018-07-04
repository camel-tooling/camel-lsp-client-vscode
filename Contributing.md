# How to provide a new version on VS Code Marketplace (Draft)

* Check that the version in package.json has not been published yet
** If already published:
*** Upgrade the version in package.json
*** Run 'npm install' so that the package-lock.json is updated
*** Push changes in a PR
*** Wait for PR to be merged
* Create a tag
* Push the tag to camel-tooling repository, it will trigger a build after few minutes
* Check build is working fine on https://travis-ci.org/camel-tooling/camel-lsp-client-vscode
* Wait that the new plugin version is validated by VS Code marketplace moderators (can take minutes or days)
* Prepare next iteration:
** Upgrade the version in package.json
** Run 'npm install' so that the package-lock.json is updated
** Push changes in a PR
** Follow PR until it is approved/merged