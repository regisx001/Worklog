How to release with tags now:

Update versions in:
package.json
Cargo.toml
tauri.conf.json
Commit and push your changes.

Create and push a tag in this format:

git tag -a app-v0.2.0 -m "Release app-v0.2.0"
git push origin app-v0.2.0
That tag push will trigger the publish workflow and attach artifacts to the release.